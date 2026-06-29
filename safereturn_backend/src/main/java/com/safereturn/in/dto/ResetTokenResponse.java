package com.safereturn.in.dto;

/**
 * Returned by POST /api/auth/forgot-password/verify-otp on success.
 *
 * The resetToken is a UUID that the client must include in the
 * subsequent POST /api/auth/forgot-password/reset call.
 * It expires in 10 minutes and can only be used once.
 */
public record ResetTokenResponse(
    String resetToken,
    String maskedPhone,
    String message
) {}