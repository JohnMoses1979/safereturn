package com.safereturn.in.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /api/reports/missing
 * Photos are uploaded separately via /api/images/upload
 */
public record CreateMissingReportRequest(

    // ─── Person Details ────────────────────────────────────────────────────

    @NotBlank(message = "Full name is required")
    @Size(max = 150, message = "Name must not exceed 150 characters")
    String fullName,

    @NotBlank(message = "Age is required")
    @Size(max = 10, message = "Age must not exceed 10 characters")
    String age,

    @NotBlank(message = "Gender is required")
    @Size(max = 20, message = "Gender must not exceed 20 characters")
    String gender,

    @Size(max = 50)
    String height,

    // ─── Last Seen ─────────────────────────────────────────────────────────

    @Size(max = 50)
    String lastSeenDate,

    @Size(max = 50)
    String lastSeenTime,

    // ─── Location ──────────────────────────────────────────────────────────

    @NotBlank(message = "Address is required")
    String address,

    @Size(max = 200)
    String landmark,

    @NotBlank(message = "City is required")
    @Size(max = 100)
    String city,

    @NotBlank(message = "State is required")
    @Size(max = 100)
    String state,

    @NotBlank(message = "Pincode is required")
    @Size(max = 10)
    String pincode,

    Double latitude,
    Double longitude,

    // ─── Physical Details ──────────────────────────────────────────────────

    @NotBlank(message = "Physical details are required")
    String physicalDetails,

    @NotBlank(message = "Other details are required")
    String otherDetails,

    // ─── Reporter ──────────────────────────────────────────────────────────

    @NotBlank(message = "Reporter name is required")
    @Size(max = 150)
    String reporterName,

    @NotBlank(message = "Relationship is required")
    @Size(max = 50)
    String relationship,

    @NotBlank(message = "Phone number is required")
    @Size(max = 15)
    String phoneNumber,

    @Size(max = 150)
    String emailAddress,

    String complexion,
    String hairColor,
    String eyeColor,
    String bodyType,
    String weight,

    // ─── Reward ────────────────────────────────────────────────────────────

    Long rewardAmount,

    // ─── Photo URLs (returned from /api/images/upload) ─────────────────────

    String photoUrl,

    java.util.List<String> extraPhotoUrls

) {}