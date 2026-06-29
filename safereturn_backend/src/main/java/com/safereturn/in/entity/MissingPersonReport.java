package com.safereturn.in.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "missing_person_reports",
    indexes = {
        @Index(name = "idx_mpr_user_id",    columnList = "user_id"),
        @Index(name = "idx_mpr_status",     columnList = "status"),
        @Index(name = "idx_mpr_created_at", columnList = "created_at"),
        @Index(name = "idx_mpr_city",       columnList = "city"),
        @Index(name = "idx_mpr_state",      columnList = "state")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class MissingPersonReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    /** The user who submitted this report */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ─── Person Details ───────────────────────────────────────────────────

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, length = 10)
    private String age;

    @Column(nullable = false, length = 20)
    private String gender;

    @Column(length = 50)
    private String height;

    // ─── Last Seen ────────────────────────────────────────────────────────

    @Column(name = "last_seen_date", length = 50)
    private String lastSeenDate;

    @Column(name = "last_seen_time", length = 50)
    private String lastSeenTime;

    // ─── Location ─────────────────────────────────────────────────────────

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(length = 200)
    private String landmark;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 10)
    private String pincode;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // ─── Physical Details ─────────────────────────────────────────────────

    @Column(name = "physical_details", columnDefinition = "TEXT")
    private String physicalDetails;

    @Column(name = "other_details", columnDefinition = "TEXT")
    private String otherDetails;

    @Column(name = "complexion", length = 50)
    private String complexion;

    @Column(name = "hair_color", length = 50)
    private String hairColor;

    @Column(name = "eye_color", length = 50)
    private String eyeColor;

    @Column(name = "body_type", length = 50)
    private String bodyType;

    @Column(name = "weight", length = 50)
    private String weight;

    // ─── Reporter / Contact ───────────────────────────────────────────────

    @Column(name = "reporter_name", nullable = false, length = 150)
    private String reporterName;

    @Column(length = 50)
    private String relationship;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "email_address", length = 150)
    private String emailAddress;

    // ─── Reward ───────────────────────────────────────────────────────────

    @Builder.Default
    @Column(name = "reward_amount")
    private Long rewardAmount = 0L;

    // ─── Status ───────────────────────────────────────────────────────────

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "Published";

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // ─── Primary Photo (stored as URL path) ───────────────────────────────

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    // ─── Extra Photos (stored as comma-separated URL paths) ───────────────

    @Column(name = "extra_photo_urls", columnDefinition = "TEXT")
    private String extraPhotoUrls;

    // ─── Timestamps ───────────────────────────────────────────────────────

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}