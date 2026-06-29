package com.safereturn.in.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Temporarily holds a verified reset token between:
 *   Step 2 — OTP verified  →  Step 3 — password reset submitted.
 *
 * Lifecycle:
 *   1. Created when forgot-password OTP is successfully verified.
 *   2. Consumed (deleted) when the new password is saved.
 *   3. Expires after 10 minutes if unused.
 *
 * Keyed by phone. One active session per phone at a time.
 * The resetToken is a random UUID — it is returned to the client
 * and must be presented along with the new password at Step 3.
 * This prevents anyone from resetting a password without first
 * completing OTP verification.
 */
@Entity
@Table(
    name = "password_reset_sessions",
    indexes = {
        @Index(name = "idx_prs_phone",       columnList = "phone"),
        @Index(name = "idx_prs_reset_token", columnList = "reset_token"),
        @Index(name = "idx_prs_expires_at",  columnList = "expires_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The 10-digit mobile number whose password is being reset. */
    @Column(nullable = false, length = 10)
    private String phone;

    /**
     * Random UUID issued to the client after OTP verification.
     * Must be presented at the reset step — acts as a short-lived
     * one-time bearer credential for the reset operation only.
     */
    @Column(name = "reset_token", nullable = false, unique = true, length = 36)
    private String resetToken;

    /** Whether this session has already been used to reset a password. */
    @Builder.Default
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean used = false;

    /** When this session expires (10 minutes after creation). */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

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

    public boolean isValid() {
        return !used && !isExpired();
    }

    /** Factory method — generates a fresh UUID reset token. */
    public static String generateResetToken() {
        return UUID.randomUUID().toString();
    }
}