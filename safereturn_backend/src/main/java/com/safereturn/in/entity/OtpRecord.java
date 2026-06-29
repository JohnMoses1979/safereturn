package com.safereturn.in.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Stores OTP records for phone verification.
 * Keyed by phone number — one active record per phone at a time.
 */
@Entity
@Table(
    name = "otp_records",
    indexes = {
        @Index(name = "idx_otp_phone", columnList = "phone"),
        @Index(name = "idx_otp_expires_at", columnList = "expires_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The phone number this OTP was sent to. */
    @Column(nullable = false, length = 10)
    private String phone;

    /** BCrypt-encoded 6-digit OTP. */
    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash;

    /**
     * Number of incorrect verification attempts so far.
     * Capped at MAX_ATTEMPTS (5) — after which the record is invalidated.
     */
    @Builder.Default
    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    /**
     * Number of times the user has requested a resend.
     * Capped at MAX_RESENDS (3).
     */
    @Builder.Default
    @Column(name = "resend_count", nullable = false)
    private int resendCount = 0;

    /** UTC timestamp when this OTP expires (5 minutes after creation). */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /** UTC timestamp of the last send/resend, used to enforce the 30-second cooldown. */
    @Column(name = "last_sent_at", nullable = false)
    private LocalDateTime lastSentAt;

    /** Whether this OTP has been successfully verified. */
    @Builder.Default
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean verified = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ─── Convenience helpers ──────────────────────────────────────────────────

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isMaxAttemptsExceeded() {
        return attemptCount >= 5;
    }

    public boolean isMaxResendsExceeded() {
        return resendCount >= 3;
    }

    public boolean isResendCoolingDown() {
        return lastSentAt != null && LocalDateTime.now().isBefore(lastSentAt.plusSeconds(30));
    }

    public void incrementAttempt() {
        this.attemptCount++;
    }

    public void incrementResend() {
        this.resendCount++;
    }
}