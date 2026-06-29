package com.safereturn.in.dto;

import java.time.LocalDateTime;

/**
 * Returned after successful login OR after OTP verification completes registration.
 */
public record AuthResponse(
    String token,
    UserDto user
) {}

// ─── UserDto ─────────────────────────────────────────────────────────────────

// Placed in same file for brevity; move to UserDto.java if preferred.
// (kept as a top-level class below)