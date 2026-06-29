package com.safereturn.in.repository;

import com.safereturn.in.entity.AlertNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertNotificationRepository extends JpaRepository<AlertNotification, Long> {

    /** All alerts for a user ordered by newest first */
    List<AlertNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Unread count for a user */
    long countByUserIdAndIsReadFalse(Long userId);

    /** Mark all alerts as read for a user */
    @Modifying
    @Query("UPDATE AlertNotification a SET a.isRead = true WHERE a.user.id = :userId")
    void markAllReadForUser(@Param("userId") Long userId);
}