package com.safereturn.in.repository;

import com.safereturn.in.entity.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {

    Optional<PendingRegistration> findByPhone(String phone);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    @Modifying
    @Query("DELETE FROM PendingRegistration p WHERE p.phone = :phone")
    void deleteByPhone(@Param("phone") String phone);

    @Modifying
    @Query("DELETE FROM PendingRegistration p WHERE p.expiresAt < :cutoff")
    void deleteAllExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}