package com.safereturn.in.exception;

/**
 * Thrown for any OTP-related business rule violation
 * (expired, wrong code, too many attempts, cooldown, etc.).
 * Maps to HTTP 422 Unprocessable Entity in GlobalExceptionHandler.
 */
public class OtpException extends RuntimeException {
    public OtpException(String message) {
        super(message);
    }
}