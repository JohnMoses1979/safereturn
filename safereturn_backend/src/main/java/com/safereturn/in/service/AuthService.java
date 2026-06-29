















package com.safereturn.in.service;

import com.safereturn.in.dto.*;
import com.safereturn.in.entity.PendingRegistration;
import com.safereturn.in.entity.User;
import com.safereturn.in.exception.OtpException;
import com.safereturn.in.exception.RegistrationException;
import com.safereturn.in.repository.PendingRegistrationRepository;
import com.safereturn.in.repository.UserRepository;
import com.safereturn.in.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    /** How long registration data is held while waiting for OTP verification. */
    private static final int PENDING_TTL_MINUTES = 10;

    private final UserRepository               userRepo;
    private final PendingRegistrationRepository pendingRepo;
    private final PasswordEncoder              passwordEncoder;
    private final JwtTokenProvider             tokenProvider;
    private final AuthenticationManager        authManager;
    private final OtpService                   otpService;

    public AuthService(UserRepository userRepo,
                       PendingRegistrationRepository pendingRepo,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuthenticationManager authManager,
                       OtpService otpService) {
        this.userRepo        = userRepo;
        this.pendingRepo     = pendingRepo;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider   = tokenProvider;
        this.authManager     = authManager;
        this.otpService      = otpService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Validate fields, check uniqueness, store pending data, send OTP
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public OtpInitiatedResponse initiateRegistration(RegisterRequest request) {

        // Cross-field password match (cannot be a Bean Validation constraint on a record)
        if (!request.passwordsMatch()) {
            throw new IllegalArgumentException("Password and confirm password do not match.");
        }

        String phone = request.normalisedPhone();
        String email = request.normalisedEmail();

        // Uniqueness checks against committed users
        if (userRepo.existsByEmail(email)) {
            throw new RegistrationException("Email address is already registered.");
        }
        if (userRepo.existsByPhone(phone)) {
            throw new RegistrationException("Mobile number is already registered.");
        }

        // Also check pending registrations (prevent spamming the OTP endpoint
        // with a different email for the same phone)
        if (pendingRepo.existsByEmail(email)) {
            // Overwrite — same user retrying with the same email is fine
            pendingRepo.deleteByPhone(pendingRepo.findByPhone(phone)
                .map(p -> p.getPhone()).orElse("__none__"));
        }

        // Upsert: delete any previous pending record for this phone then insert fresh
        pendingRepo.deleteByPhone(phone);

        PendingRegistration pending = PendingRegistration.builder()
            .phone(phone)
            .fullName(request.normalisedFullName())
            .email(email)
            .passwordHash(passwordEncoder.encode(request.password()))
            .expiresAt(LocalDateTime.now().plusMinutes(PENDING_TTL_MINUTES))
            .build();

        pendingRepo.save(pending);

        // Fire OTP SMS (generates OtpRecord internally)
        long expiresAtMs = otpService.sendOtp(phone);

        log.info("Registration initiated for phone ending ...{}", phone.substring(phone.length() - 4));

        return new OtpInitiatedResponse(
            maskPhone(phone),
            expiresAtMs,
            3,   // max resends at start
            "OTP sent to your registered mobile number."
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Verify OTP → create user → return JWT
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse completeRegistration(VerifyOtpRequest request) {
        String phone = request.phone().trim();

        // 1. Verify OTP (throws OtpException on failure)
        otpService.verifyOtp(phone, request.otp().trim());

        // 2. Retrieve pending registration
        PendingRegistration pending = pendingRepo.findByPhone(phone)
            .orElseThrow(() -> new OtpException(
                "Registration session has expired. Please restart the registration process."));

        if (pending.isExpired()) {
            pendingRepo.deleteByPhone(phone);
            throw new OtpException(
                "Registration session has expired. Please restart the registration process.");
        }

        // 3. Final uniqueness guard (race condition safety)
        if (userRepo.existsByEmail(pending.getEmail())) {
            throw new RegistrationException("Email address is already registered.");
        }
        if (userRepo.existsByPhone(phone)) {
            throw new RegistrationException("Mobile number is already registered.");
        }

        // 4. Create and persist the User
        User user = User.builder()
            .fullName(pending.getFullName())
            .email(pending.getEmail())
            .phone(phone)
            .password(pending.getPasswordHash())
            .enabled(true)           // account is active after OTP verification
            .phoneVerified(true)
            .emailVerified(false)    // email verification is a separate future flow
            .role(User.Role.USER)
            .build();

        User savedUser = userRepo.save(user);

        // 5. Cleanup
        pendingRepo.deleteByPhone(phone);
        otpService.cleanupForPhone(phone);

        // 6. Issue JWT
        String token = tokenProvider.generateToken(savedUser.getEmail());

        log.info("User registered successfully. id={} phone=...{}",
            savedUser.getId(), phone.substring(phone.length() - 4));

        return new AuthResponse(token, mapToDto(savedUser));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESEND OTP
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public OtpInitiatedResponse resendOtp(ResendOtpRequest request) {
        String phone = request.phone().trim();

        // Must have an active pending registration
        pendingRepo.findByPhone(phone)
            .filter(p -> !p.isExpired())
            .orElseThrow(() -> new OtpException(
                "No active registration session found. Please restart registration."));

        long expiresAtMs = otpService.resendOtp(phone);
        int  resendsLeft = otpService.resendsRemaining(phone);

        return new OtpInitiatedResponse(
            maskPhone(phone),
            expiresAtMs,
            resendsLeft,
            "A new OTP has been sent to your mobile number."
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Spring Security handles BadCredentialsException and DisabledException
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.email().trim().toLowerCase(),
                request.password()
            )
        );

        User user = userRepo.findByEmail(request.email().trim().toLowerCase())
            .orElseThrow(() -> new UsernameNotFoundException("User not found."));

        // Stamp last login
        userRepo.updateLastLogin(user.getId(), LocalDateTime.now());
        user.setLastLogin(LocalDateTime.now());

        String token = tokenProvider.generateToken(user.getEmail());
        log.info("User logged in. id={}", user.getId());

        return new AuthResponse(token, mapToDto(user));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CURRENT USER
    // ─────────────────────────────────────────────────────────────────────────

    public UserDto getCurrentUser(String email) {
        User user = userRepo.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found."));
        return mapToDto(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Central mapper — keep in sync with ProfileService.mapToDto.
     * Includes all profile fields; never exposes the password hash.
     */
    public UserDto mapToDto(User user) {
        return new UserDto(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole().name(),
            user.isPhoneVerified(),
            user.isEmailVerified(),
            user.getAddress(),
            user.getCity(),
            user.getState(),
            user.getCountry(),
            user.getEmergencyContactName(),
            user.getEmergencyContactNumber(),
            user.getCreatedAt(),
            user.getLastLogin()
        );
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "******";
        return "******" + phone.substring(phone.length() - 4);
    }
}