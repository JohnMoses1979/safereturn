package com.safereturn.in.exception;

/**
 * Thrown for registration-specific conflicts (duplicate email/phone).
 * Maps to HTTP 409 Conflict in GlobalExceptionHandler.
 */
public class RegistrationException extends RuntimeException {
    public RegistrationException(String message) {
        super(message);
    }
}