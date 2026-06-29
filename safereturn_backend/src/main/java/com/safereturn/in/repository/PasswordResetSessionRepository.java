package com.safereturn.in.repository;

import com.safereturn.in.entity.PasswordResetSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetSessionRepository extends JpaRepository<PasswordResetSession, Long> {

    /** Find an active (unused, non-expired) session by reset token. */
    Optional<PasswordResetSession> findByResetTokenAndUsedFalse(String resetToken);

    /** Find any session for a phone (used to check / clean up). */
    Optional<PasswordResetSession> findTopByPhoneOrderByCreatedAtDesc(String phone);

    /** Delete all sessions for a given phone — called on new initiation and after use. */
    @Modifying
    @Query("DELETE FROM PasswordResetSession s WHERE s.phone = :phone")
    void deleteAllByPhone(@Param("phone") String phone);

    /** Housekeeping — purge expired sessions. */
    @Modifying
    @Query("DELETE FROM PasswordResetSession s WHERE s.expiresAt < :cutoff")
    void deleteAllExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}