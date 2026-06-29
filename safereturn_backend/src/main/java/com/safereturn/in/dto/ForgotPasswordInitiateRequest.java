package com.safereturn.in.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Step 1 — Initiate forgot-password.
 * Client sends only the registered mobile number.
 */
public record ForgotPasswordInitiateRequest(

    @NotBlank(message = "Mobile number is required")
    @Pattern(
        regexp = "^[1-9][0-9]{9}$",
        message = "Phone must be exactly 10 digits and cannot start with 0"
    )
    String phone

) {}