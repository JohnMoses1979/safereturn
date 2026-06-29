// ─────────────────────────────────────────────────────────────────────────────
// RegisterRequest.java
// ─────────────────────────────────────────────────────────────────────────────
package com.safereturn.in.dto;

import jakarta.validation.constraints.*;

/**
 * Step-1 payload: initiate registration + trigger OTP.
 * Password is validated here so we fail fast before sending an SMS.
 */
public record RegisterRequest(

    @NotBlank(message = "Full name is required")
    @Size(min = 3, max = 100, message = "Full name must be 3–100 characters")
    @Pattern(
        regexp = "^[A-Za-z][A-Za-z ]{1,98}[A-Za-z]$",
        message = "Full name may contain letters and spaces only"
    )
    String fullName,

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^[1-9][0-9]{9}$",
        message = "Phone must be exactly 10 digits and cannot start with 0"
    )
    String phone,

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid address")
    @Size(max = 150, message = "Email must be at most 150 characters")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 64, message = "Password must be 8–64 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,64}$",
        message = "Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character"
    )
    String password,

    @NotBlank(message = "Confirm password is required")
    String confirmPassword

) {
    /** Business-level cross-field check (not a Bean Validation constraint). */
    public boolean passwordsMatch() {
        return password != null && password.equals(confirmPassword);
    }

    /** Normalise email before use. */
    public String normalisedEmail() {
        return email == null ? null : email.trim().toLowerCase();
    }

    public String normalisedPhone() {
        return phone == null ? null : phone.trim();
    }

    public String normalisedFullName() {
        return fullName == null ? null : fullName.trim();
    }
}