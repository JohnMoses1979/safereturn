package com.safereturn.in.dto;

import java.time.LocalDateTime;

/**
 * Full response DTO for a sighting report.
 */
public record SightingReportDto(
    Long   id,
    String sightingId,
    String type,
    String reportType,
    String status,
    boolean verified,

    // Missing person info (denormalized for frontend convenience)
    Long   personId,
    String missingReportId,
    String personName,
    String name,
    String age,
    String gender,
    String originalLocation,
    String missingPersonImage,

    // Reward (from linked missing report)
    Long   rewardAmount,
    String rewardCurrency,
    String rewardText,
    boolean rewardEnabled,

    // When
    String seenDate,
    String seenTime,
    String dateTime,

    // Where
    String location,
    String seenAddress,
    String lastSeenPlace,
    Double latitude,
    Double longitude,

    // What
    String seenOption,
    String details,

    // Photo
    String photoUrl,
    String imageUri,
    String image,
    String sightingImage,

    // Reporter
    String reportedBy,
    String contactName,
    String phone,
    String reporterAddress,

    // Timing
    String time,

    // ─── Verification fields ──────────────────────────────────────────
    LocalDateTime verifiedAt,
    Long   verifiedById,
    String verifiedByName,

    // ─── Sighting-level reward fields ─────────────────────────────────
    boolean sightingRewardOffered,
    Long    sightingRewardAmount,
    boolean sightingRewardProvided,

    // ─── Ownership helper ─────────────────────────────────────────────
    Long   reportOwnerUserId,

    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}