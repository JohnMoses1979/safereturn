package com.safereturn.in.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full response DTO for a missing person report.
 * Matches exactly what the frontend SafeReturnContext expects.
 */
public record MissingPersonReportDto(
    Long   id,
    String reportId,
    String type,
    String reportType,
    String status,

    // Person details
    String name,
    String fullName,
    String age,
    String gender,
    String height,

    // Last seen
    String lastSeenDate,
    String lastSeenTime,
    String lastSeen,

    // Location
    String address,
    String lastSeenPlace,
    String landmark,
    String city,
    String state,
    String location,
    String pincode,
    Double latitude,
    Double longitude,

    // ─── Physical
    String physicalDetails,
    String otherDetails,
    String description,
    String identificationMarks,
    String complexion,
    String hairColor,
    String eyeColor,
    String bodyType,
    String weight,

    // Reporter
    String guardianName,
    String reporterName,
    String relationship,
    String contactNumber,
    String phoneNumber,
    String emailAddress,

    // Reward
    Long   rewardAmount,
    String rewardCurrency,
    String rewardText,
    boolean rewardEnabled,

    // Images
    String photoUrl,
    String image,
    String imageUri,
    List<String> extraPhotos,

    // Timing
    String reportedTime,
    String lastSeenTimeShort,
    String time,

    // Ownership
    Long   userId,
    String userFullName,

    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}