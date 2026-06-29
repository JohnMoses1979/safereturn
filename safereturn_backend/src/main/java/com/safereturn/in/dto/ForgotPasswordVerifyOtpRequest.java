package com.safereturn.in.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Step 2 — Verify OTP for forgot-password flow.
 * On success the server returns a short-lived reset token.
 */
public record ForgotPasswordVerifyOtpRequest(

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^[1-9][0-9]{9}$",
        message = "Phone must be exactly 10 digits"
    )
    String phone,

    @NotBlank(message = "OTP is required")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must contain only digits")
    String otp

) {}