package com.safereturn.in.controller;

import com.safereturn.in.dto.*;
import com.safereturn.in.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Auth endpoints:
 *
 *   POST /api/auth/register        — Step 1: validate data + send OTP
 *   POST /api/auth/verify-otp      — Step 2: verify OTP + create user + return JWT
 *   POST /api/auth/resend-otp      — Resend OTP (subject to cooldown/limits)
 *   POST /api/auth/login           — Login with email + password
 *   GET  /api/auth/me              — Get current user (requires Bearer token)
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Step 1 — Initiate registration.
     * Validates all fields, checks uniqueness, stores pending data, sends OTP SMS.
     * Returns 202 Accepted (not 200) because the resource hasn't been created yet.
     */
    @PostMapping("/register")
    public ResponseEntity<OtpInitiatedResponse> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        OtpInitiatedResponse response = authService.initiateRegistration(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * Step 2 — Verify OTP and complete registration.
     * On success returns 201 Created with a JWT + user object.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(
        @Valid @RequestBody VerifyOtpRequest request
    ) {
        AuthResponse response = authService.completeRegistration(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Resend OTP — enforces 30-second cooldown and max 3 resends.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<OtpInitiatedResponse> resendOtp(
        @Valid @RequestBody ResendOtpRequest request
    ) {
        OtpInitiatedResponse response = authService.resendOtp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Login with email + password.
     * Requires account to be enabled (i.e. OTP verified).
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Returns the profile of the currently authenticated user.
     * Requires a valid Bearer JWT in the Authorization header.
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserDto user = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(user);
    }
}