package com.safereturn.in.service;

import com.safereturn.in.dto.AlertNotificationDto;
import com.safereturn.in.dto.MissingPersonReportDto;
import com.safereturn.in.dto.SightingReportDto;
import com.safereturn.in.entity.AlertNotification;
import com.safereturn.in.entity.MissingPersonReport;
import com.safereturn.in.entity.SightingReport;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Converts JPA entities to response DTOs.
 * Lives here (not in the service classes) to keep mapping logic centralised
 * and reusable across MissingPersonService, SightingService, AlertService.
 */
@Component
public class ReportMapper {

    // ─── Missing Person Report ─────────────────────────────────────────────

    public MissingPersonReportDto toDto(MissingPersonReport r) {
        long reward = r.getRewardAmount() != null ? r.getRewardAmount() : 0L;
        String location = buildLocation(r.getCity(), r.getState());
        String lastSeen = buildLastSeen(r.getLastSeenDate(), r.getLastSeenTime());
        String timeAgo  = formatTimeAgo(r.getCreatedAt());

        List<String> extraPhotos = parseExtraPhotos(r.getExtraPhotoUrls());

        return new MissingPersonReportDto(
            r.getId(),
            "MP-" + r.getId(),        // reportId
            "Missing Person",
            "Missing Person",
            r.getStatus(),

            r.getFullName(),           // name
            r.getFullName(),           // fullName
            r.getAge(),
            r.getGender(),
            r.getHeight(),

            r.getLastSeenDate(),
            r.getLastSeenTime(),
            lastSeen,

            r.getAddress(),
            r.getAddress(),           // lastSeenPlace
            r.getLandmark(),
            r.getCity(),
            r.getState(),
            location,
            r.getPincode(),
            r.getLatitude(),
            r.getLongitude(),

            r.getPhysicalDetails(),
            r.getOtherDetails(),
            buildDescription(r.getPhysicalDetails(), r.getOtherDetails()),
            r.getPhysicalDetails(),   // identificationMarks
            r.getComplexion(),
            r.getHairColor(),
            r.getEyeColor(),
            r.getBodyType(),
            r.getWeight(),

            r.getReporterName(),      // guardianName
            r.getReporterName(),
            r.getRelationship(),
            r.getPhoneNumber(),       // contactNumber
            r.getPhoneNumber(),
            r.getEmailAddress(),

            reward,
            "INR",
            reward > 0 ? "₹" + reward : "No reward added",
            reward > 0,

            r.getPhotoUrl(),
            r.getPhotoUrl(),          // image
            r.getPhotoUrl(),          // imageUri
            extraPhotos,

            "Reported " + timeAgo,
            "Last seen " + timeAgo,
            timeAgo,

            r.getUser() != null ? r.getUser().getId() : null,
            r.getUser() != null ? r.getUser().getFullName() : null,

            r.getCreatedAt(),
            r.getUpdatedAt()
        );
    }

    // ─── Sighting Report ──────────────────────────────────────────────────

    public SightingReportDto toDto(SightingReport s) {
        MissingPersonReport mp = s.getMissingReport();
        long reward = mp != null && mp.getRewardAmount() != null ? mp.getRewardAmount() : 0L;
        String timeAgo = formatTimeAgo(s.getCreatedAt());
        String dateTime = buildDateTime(s.getSeenDate(), s.getSeenTime());

        return new SightingReportDto(
            s.getId(),
            "SG-" + s.getId(),
            "Sighting",
            "Sighting",
            s.getStatus() != null ? s.getStatus().name() : "PENDING_VERIFICATION",
            s.isVerified(),

            mp != null ? mp.getId() : null,
            mp != null ? "MP-" + mp.getId() : null,
            mp != null ? mp.getFullName() : "Unknown Person",
            mp != null ? mp.getFullName() : "Unknown Person",
            mp != null ? mp.getAge() : "N/A",
            mp != null ? mp.getGender() : "N/A",
            mp != null ? mp.getAddress() : "N/A",
            mp != null ? mp.getPhotoUrl() : null,

            reward,
            "INR",
            reward > 0 ? "₹" + reward : "No reward added",
            reward > 0,

            s.getSeenDate(),
            s.getSeenTime(),
            dateTime,

            s.getLocation(),
            s.getLocation(),   // seenAddress
            s.getLocation(),   // lastSeenPlace
            s.getLatitude(),
            s.getLongitude(),

            s.getSeenOption(),
            s.getDetails() != null ? s.getDetails() : "No additional details provided.",

            s.getPhotoUrl(),
            s.getPhotoUrl(),   // imageUri
            s.getPhotoUrl(),   // image
            s.getPhotoUrl(),   // sightingImage

            s.getContactName() != null ? s.getContactName() : "Community Member",
            s.getUser() != null ? s.getUser().getFullName() : "Community Member",
            s.getUser() != null ? s.getUser().getPhone() : "Not provided",

            s.getUser() != null ? s.getUser().getAddress() : null,
            timeAgo,

            s.getVerifiedAt(),
            s.getVerifiedBy() != null ? s.getVerifiedBy().getId() : null,
            s.getVerifiedBy() != null ? s.getVerifiedBy().getFullName() : null,

            s.isRewardOffered(),
            s.getRewardAmount(),
            s.isRewardProvided(),

            mp != null && mp.getUser() != null ? mp.getUser().getId() : null,

            s.getCreatedAt(),
            s.getUpdatedAt()
        );
    }

    // ─── Alert ────────────────────────────────────────────────────────────

    public AlertNotificationDto toDto(AlertNotification a) {
        MissingPersonReport mp = a.getMissingReport();
        SightingReport      sr = a.getSightingReport();

        return new AlertNotificationDto(
            a.getId(),
            a.getType(),
            a.getTitle(),
            a.getSubtitle(),
            formatTimeAgo(a.getCreatedAt()),
            a.getStatus(),
            colorForType(a.getType()),
            iconForType(a.getType()),
            a.isRead(),

            mp != null ? mp.getId() : null,
            mp != null ? mp.getFullName() : null,
            mp != null ? mp.getPhotoUrl() : null,
            mp != null && mp.getRewardAmount() != null ? mp.getRewardAmount() : 0L,

            sr != null ? sr.getId() : null,
            sr != null ? sr.getLocation() : null,

            a.getCreatedAt()
        );
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private String buildLocation(String city, String state) {
        if (city != null && state != null) return city + ", " + state;
        if (city  != null) return city;
        if (state != null) return state;
        return "Location not provided";
    }

    private String buildLastSeen(String date, String time) {
        if (date != null && time != null) return "Last seen on " + date + " at " + time;
        if (date != null) return "Last seen on " + date;
        return "Last seen details not provided";
    }

    private String buildDateTime(String date, String time) {
        if (date != null && time != null) return date + ", " + time;
        if (date != null) return date;
        return "Date/time not provided";
    }

    private String buildDescription(String physical, String other) {
        if (physical != null && other != null) return physical + " " + other;
        if (physical != null) return physical;
        if (other    != null) return other;
        return "No description provided.";
    }

    private List<String> parseExtraPhotos(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyList();
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    public String formatTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "Just now";
        long minutes = ChronoUnit.MINUTES.between(dateTime, LocalDateTime.now());
        if (minutes < 1)   return "Just now";
        if (minutes < 60)  return minutes + " min ago";
        long hours = minutes / 60;
        if (hours < 24)    return hours + " hour" + (hours > 1 ? "s" : "") + " ago";
        long days = hours / 24;
        if (days < 7)      return days + " day" + (days > 1 ? "s" : "") + " ago";
        return dateTime.toLocalDate().toString();
    }

    private String colorForType(String type) {
        if (type == null) return "#2F8CFF";
        return switch (type) {
            case "Sightings"  -> "#2F8CFF";
            case "Updates"    -> "#19C970";
            case "Community"  -> "#FF8A1F";
            default           -> "#2F8CFF";
        };
    }

    private String iconForType(String type) {
        if (type == null) return "notifications-outline";
        return switch (type) {
            case "Sightings"  -> "eye-outline";
            case "Updates"    -> "checkmark-circle-outline";
            case "Community"  -> "people-outline";
            default           -> "notifications-outline";
        };
    }
}