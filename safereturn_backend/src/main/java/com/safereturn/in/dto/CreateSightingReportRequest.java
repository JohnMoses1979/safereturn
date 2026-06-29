package com.safereturn.in.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for POST /api/reports/sightings
 */
public record CreateSightingReportRequest(

    @NotNull(message = "Missing report ID is required")
    Long missingReportId,

    @NotBlank(message = "Sighting date is required")
    String seenDate,

    @NotBlank(message = "Sighting time is required")
    String seenTime,

    @NotBlank(message = "Location is required")
    String location,

    Double latitude,
    Double longitude,

    @NotBlank(message = "Please select how you saw the person")
    String seenOption,

    String details,

    // URL returned from /api/images/upload (optional)
    String photoUrl,

    String contactName,
    String contactPhone

) {}