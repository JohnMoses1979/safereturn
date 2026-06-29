package com.safereturn.in.dto;

/**
 * Returned immediately after Step-1 registration request.
 * The client must next call /api/auth/verify-otp with the OTP received on the phone.
 */
public record OtpInitiatedResponse(
    /** Masked version of the phone for display, e.g. "******7890". */
    String maskedPhone,
    /** UTC epoch millis when the OTP expires — client can show a countdown. */
    long expiresAtEpochMs,
    /** How many resends the user has left. */
    int resendsRemaining,
    String message
) {}