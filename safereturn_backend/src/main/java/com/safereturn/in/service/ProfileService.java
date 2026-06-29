
















package com.safereturn.in.service;

import com.safereturn.in.dto.UpdateProfileRequest;
import com.safereturn.in.dto.UserDto;
import com.safereturn.in.entity.User;
import com.safereturn.in.exception.RegistrationException;
import com.safereturn.in.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileService.class);

    private final UserRepository userRepo;

    public ProfileService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    // ─── GET /api/profile ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserDto getProfile(String email) {
        User user = findByEmail(email);
        return mapToDto(user);
    }

    // ─── PUT /api/profile ─────────────────────────────────────────────────────

    @Transactional
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = findByEmail(email);

        // ── Full Name ──────────────────────────────────────────────────────────
        String newFullName = UpdateProfileRequest.sanitize(request.fullName());
        if (newFullName != null) {
            user.setFullName(newFullName);
        }

        // ── Email (uniqueness check if changed) ────────────────────────────────
        String newEmail = UpdateProfileRequest.sanitize(request.email());
        if (newEmail != null && !newEmail.equalsIgnoreCase(user.getEmail())) {
            String normalised = newEmail.toLowerCase();
            if (userRepo.existsByEmail(normalised)) {
                throw new RegistrationException("Email address is already in use by another account.");
            }
            user.setEmail(normalised);
            // Email changed → mark unverified until a verification flow runs
            user.setEmailVerified(false);
        }

        // ── Address fields ─────────────────────────────────────────────────────
        String newAddress = UpdateProfileRequest.sanitize(request.address());
        if (newAddress != null) user.setAddress(newAddress);

        String newCity = UpdateProfileRequest.sanitize(request.city());
        if (newCity != null) user.setCity(newCity);

        String newState = UpdateProfileRequest.sanitize(request.state());
        if (newState != null) user.setState(newState);

        String newCountry = UpdateProfileRequest.sanitize(request.country());
        if (newCountry != null) user.setCountry(newCountry);

        // ── Emergency contact ──────────────────────────────────────────────────
        String newEcName = UpdateProfileRequest.sanitize(request.emergencyContactName());
        if (newEcName != null) user.setEmergencyContactName(newEcName);

        String newEcNumber = UpdateProfileRequest.sanitize(request.emergencyContactNumber());
        if (newEcNumber != null) user.setEmergencyContactNumber(newEcNumber);

        // ── Persist ────────────────────────────────────────────────────────────
        User saved = userRepo.save(user);
        log.info("Profile updated for user id={}", saved.getId());

        return mapToDto(saved);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User findByEmail(String email) {
        return userRepo.findByEmail(email.toLowerCase())
            .orElseThrow(() -> new UsernameNotFoundException(
                "User not found with email: " + email));
    }

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
}