package com.safereturn.in.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for alert notifications.
 * Maps to the alert shape the frontend AlertsScreen and SafeReturnContext expect.
 */
public record AlertNotificationDto(
    Long   id,
    String type,       // "Sightings" | "Updates" | "Community"
    String title,
    String subtitle,
    String time,       // human-readable "2 hours ago"
    String status,     // label shown on card e.g. "NEW SIGHTING", "PUBLISHED"
    String color,      // hex color for the alert card
    String icon,       // Ionicons name
    boolean isRead,

    // Linked report snapshot (for navigation)
    Long   missingReportId,
    String personName,
    String personImage,
    Long   rewardAmount,

    // Linked sighting snapshot
    Long   sightingReportId,
    String sightingLocation,

    LocalDateTime createdAt
) {}