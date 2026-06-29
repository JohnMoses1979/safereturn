package com.safereturn.in.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Step 3 — Reset password.
 * Client must present the resetToken obtained from Step 2, plus the new password.
 * The resetToken is a UUID issued after successful OTP verification — it acts as
 * a one-time credential that proves OTP was already verified.
 */
public record ForgotPasswordResetRequest(

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^[1-9][0-9]{9}$",
        message = "Phone must be exactly 10 digits"
    )
    String phone,

    @NotBlank(message = "Reset token is required")
    String resetToken,

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 64, message = "Password must be 8–64 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,64}$",
        message = "Password must contain at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character"
    )
    String newPassword,

    @NotBlank(message = "Confirm password is required")
    String confirmPassword

) {
    /** Cross-field validation — must match before hitting the service layer. */
    public boolean passwordsMatch() {
        return newPassword != null && newPassword.equals(confirmPassword);
    }
}