package com.safereturn.in.controller;

import com.safereturn.in.dto.*;
import com.safereturn.in.service.ForgotPasswordService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Forgot-password endpoints:
 *
 *   POST /api/auth/forgot-password/initiate    — Step 1: verify phone + send OTP
 *   POST /api/auth/forgot-password/verify-otp  — Step 2: verify OTP + get reset token
 *   POST /api/auth/forgot-password/resend-otp  — Resend OTP (same cooldown/limits as registration)
 *   POST /api/auth/forgot-password/reset       — Step 3: submit new password with reset token
 *
 * All endpoints are public (no JWT required) — they are added to the permit-list in SecurityConfig.
 */
@RestController
@RequestMapping("/api/auth/forgot-password")
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    public ForgotPasswordController(ForgotPasswordService forgotPasswordService) {
        this.forgotPasswordService = forgotPasswordService;
    }

    /**
     * Step 1 — Initiate forgot-password.
     * Validates phone exists and sends OTP via existing SMS infrastructure.
     * Returns 202 Accepted (resource not yet changed).
     */
    @PostMapping("/initiate")
    public ResponseEntity<OtpInitiatedResponse> initiate(
        @Valid @RequestBody ForgotPasswordInitiateRequest request
    ) {
        OtpInitiatedResponse response = forgotPasswordService.initiateReset(request);
        return ResponseEntity.accepted().body(response);
    }

    /**
     * Step 2 — Verify OTP.
     * On success returns a short-lived UUID reset token.
     * The client must present this token at Step 3.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ResetTokenResponse> verifyOtp(
        @Valid @RequestBody ForgotPasswordVerifyOtpRequest request
    ) {
        ResetTokenResponse response = forgotPasswordService.verifyOtpAndIssueToken(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Resend OTP — subject to same 30-second cooldown and 3-resend cap as registration.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<OtpInitiatedResponse> resendOtp(
        @RequestBody Map<String, String> body
    ) {
        String phone = body.getOrDefault("phone", "").trim();
        if (phone.isEmpty()) {
            throw new IllegalArgumentException("Phone number is required.");
        }
        OtpInitiatedResponse response = forgotPasswordService.resendResetOtp(phone);
        return ResponseEntity.ok(response);
    }

    /**
     * Step 3 — Reset password.
     * Requires the reset token from Step 2.
     * Returns 200 OK with a success message on completion.
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> reset(
        @Valid @RequestBody ForgotPasswordResetRequest request
    ) {
        forgotPasswordService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message",
            "Password reset successfully. You can now log in with your new password."));
    }
}