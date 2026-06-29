package com.safereturn.in.service;

import com.safereturn.in.dto.*;
import com.safereturn.in.entity.PasswordResetSession;
import com.safereturn.in.entity.User;
import com.safereturn.in.exception.OtpException;
import com.safereturn.in.repository.PasswordResetSessionRepository;
import com.safereturn.in.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Handles the complete forgot-password lifecycle:
 *
 *   Step 1 — initiateReset:
 *     · Verify phone exists (generic error if not — prevents enumeration)
 *     · Clean up any previous OTP / reset session for this phone
 *     · Trigger OTP via the shared OtpService (reuses existing SMS infrastructure)
 *
 *   Step 2 — verifyOtpAndIssueToken:
 *     · Validate OTP via OtpService (reuses all attempt/expiry logic)
 *     · Create a PasswordResetSession with a UUID reset token
 *     · Return the reset token to the client
 *
 *   Step 3 — resetPassword:
 *     · Validate reset token (must exist, unused, non-expired, phone match)
 *     · Validate new password (length, complexity, confirm match)
 *     · BCrypt-encode and update User.password
 *     · Mark session as used + clean up OTP records
 */
@Service
public class ForgotPasswordService {

    private static final Logger log = LoggerFactory.getLogger(ForgotPasswordService.class);

    /** How long the reset token stays valid after OTP verification (minutes). */
    private static final int RESET_TOKEN_TTL_MINUTES = 10;

    private final UserRepository                userRepo;
    private final PasswordResetSessionRepository resetSessionRepo;
    private final OtpService                    otpService;
    private final PasswordEncoder               passwordEncoder;

    public ForgotPasswordService(UserRepository userRepo,
                                 PasswordResetSessionRepository resetSessionRepo,
                                 OtpService otpService,
                                 PasswordEncoder passwordEncoder) {
        this.userRepo          = userRepo;
        this.resetSessionRepo  = resetSessionRepo;
        this.otpService        = otpService;
        this.passwordEncoder   = passwordEncoder;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Initiate: verify account exists, send OTP
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public OtpInitiatedResponse initiateReset(ForgotPasswordInitiateRequest request) {
        String phone = request.phone().trim();

        // Verify the account exists.
        // IMPORTANT: we throw the same generic message whether the phone is found
        // or not to prevent user-enumeration attacks. The log is for internal use only.
        User user = userRepo.findByPhone(phone).orElse(null);
        if (user == null || !user.isEnabled()) {
            // Log internally but return a generic response to the client
            log.warn("Forgot-password requested for unregistered/disabled phone ending ...{}",
                phone.substring(phone.length() - 4));
            // Generic message — does not reveal account existence
            throw new IllegalArgumentException(
                "If this number is registered, an OTP will be sent.");
        }

        // Clean up any previous reset session for this phone (idempotent retry safety)
        resetSessionRepo.deleteAllByPhone(phone);

        // Reuse existing OTP infrastructure — this handles:
        //   · Generating a 6-digit OTP
        //   · BCrypt-hashing it
        //   · Persisting an OtpRecord
        //   · Sending the SMS via TwilioSmsService
        long expiresAtMs = otpService.sendOtp(phone);

        log.info("Password reset OTP sent for phone ending ...{}", phone.substring(phone.length() - 4));

        return new OtpInitiatedResponse(
            maskPhone(phone),
            expiresAtMs,
            3,
            "OTP sent to your registered mobile number."
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Verify OTP, issue short-lived reset token
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ResetTokenResponse verifyOtpAndIssueToken(ForgotPasswordVerifyOtpRequest request) {
        String phone = request.phone().trim();

        // Delegates entirely to OtpService — reuses all attempt/expiry/lock logic.
        // Throws OtpException on failure (handled by GlobalExceptionHandler).
        otpService.verifyOtp(phone, request.otp().trim());

        // Clean up any stale reset session before creating a fresh one
        resetSessionRepo.deleteAllByPhone(phone);

        // Issue a UUID reset token — this is what the client presents at Step 3
        String resetToken = PasswordResetSession.generateResetToken();

        PasswordResetSession session = PasswordResetSession.builder()
            .phone(phone)
            .resetToken(resetToken)
            .used(false)
            .expiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_TTL_MINUTES))
            .build();

        resetSessionRepo.save(session);

        log.info("Reset token issued for phone ending ...{}", phone.substring(phone.length() - 4));

        return new ResetTokenResponse(
            resetToken,
            maskPhone(phone),
            "OTP verified. You may now reset your password."
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3 — Reset password using the verified reset token
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public void resetPassword(ForgotPasswordResetRequest request) {
        String phone      = request.phone().trim();
        String resetToken = request.resetToken().trim();

        // ── Cross-field: passwords must match ────────────────────────────────
        if (!request.passwordsMatch()) {
            throw new IllegalArgumentException("New password and confirm password do not match.");
        }

        // ── Validate the reset token ──────────────────────────────────────────
        PasswordResetSession session = resetSessionRepo
            .findByResetTokenAndUsedFalse(resetToken)
            .orElseThrow(() -> new OtpException(
                "Invalid or expired reset token. Please restart the process."));

        // Token must belong to the phone sent in this request (prevents token swap)
        if (!session.getPhone().equals(phone)) {
            log.warn("Reset token phone mismatch — possible attack. phone=...{}", phone.substring(phone.length() - 4));
            throw new OtpException("Invalid reset token.");
        }

        if (session.isExpired()) {
            resetSessionRepo.deleteAllByPhone(phone);
            throw new OtpException(
                "Reset session has expired. Please restart the forgot-password process.");
        }

        // ── Fetch user ────────────────────────────────────────────────────────
        User user = userRepo.findByPhone(phone)
            .orElseThrow(() -> new IllegalArgumentException("Account not found."));

        // ── Update password — BCrypt encoded, never plain text ────────────────
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepo.save(user);

        // ── Mark session as used + clean up OTP records ───────────────────────
        session.setUsed(true);
        resetSessionRepo.save(session);
        otpService.cleanupForPhone(phone);

        log.info("Password reset successfully for user id={} phone=...{}",
            user.getId(), phone.substring(phone.length() - 4));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESEND OTP (during forgot-password flow)
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public OtpInitiatedResponse resendResetOtp(String phone) {
        phone = phone.trim();

        // Verify account still exists
        if (!userRepo.existsByPhone(phone)) {
            throw new IllegalArgumentException(
                "If this number is registered, an OTP will be sent.");
        }

        // Delegates to OtpService — enforces cooldown + max resend limits
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
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "******";
        return "******" + phone.substring(phone.length() - 4);
    }
}