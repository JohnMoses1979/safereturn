package com.safereturn.in.repository;

import com.safereturn.in.entity.OtpRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRecordRepository extends JpaRepository<OtpRecord, Long> {

    /** Latest unverified OTP record for a given phone. */
    Optional<OtpRecord> findTopByPhoneAndVerifiedFalseOrderByCreatedAtDesc(String phone);

    /** Delete all OTP records for a phone (cleanup after successful verification). */
    @Modifying
    @Query("DELETE FROM OtpRecord o WHERE o.phone = :phone")
    void deleteAllByPhone(@Param("phone") String phone);

    /** Housekeeping — purge expired records older than a given cutoff. */
    @Modifying
    @Query("DELETE FROM OtpRecord o WHERE o.expiresAt < :cutoff")
    void deleteAllExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}