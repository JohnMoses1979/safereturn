package com.safereturn.in.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Temporarily holds registration data (hashed password) between
 * "initiate registration" and "OTP verified → create user".
 *
 * Keyed by phone. A new registration for the same phone replaces the old record.
 * Expires after 10 minutes (same session window as OTP).
 */
@Entity
@Table(
    name = "pending_registrations",
    indexes = {
        @Index(name = "idx_pending_phone", columnList = "phone"),
        @Index(name = "idx_pending_expires", columnList = "expires_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String phone;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 150)
    private String email;

    /** BCrypt-encoded password stored before user row exists. */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}