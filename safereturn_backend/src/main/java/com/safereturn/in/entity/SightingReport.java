package com.safereturn.in.entity;

import com.safereturn.in.enums.SightingStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "sighting_reports",
    indexes = {
        @Index(name = "idx_sr_report_id",   columnList = "missing_report_id"),
        @Index(name = "idx_sr_user_id",     columnList = "user_id"),
        @Index(name = "idx_sr_created_at",  columnList = "created_at"),
        @Index(name = "idx_sr_status",      columnList = "status")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SightingReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    /** The missing person report this sighting is linked to */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "missing_report_id", nullable = false)
    private MissingPersonReport missingReport;

    /** The user who submitted this sighting (can be null for anonymous) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // ─── When ─────────────────────────────────────────────────────────────

    @Column(name = "seen_date", length = 50)
    private String seenDate;

    @Column(name = "seen_time", length = 50)
    private String seenTime;

    // ─── Where ────────────────────────────────────────────────────────────

    @Column(name = "location", columnDefinition = "TEXT")
    private String location;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // ─── How Seen ─────────────────────────────────────────────────────────

    @Column(name = "seen_option", length = 100)
    private String seenOption;

    // ─── Details ──────────────────────────────────────────────────────────

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    // ─── Photo ────────────────────────────────────────────────────────────

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    // ─── Reporter Contact ─────────────────────────────────────────────────

    @Column(name = "contact_name", length = 150)
    private String contactName;

    @Column(name = "contact_phone", length = 15)
    private String contactPhone;

    // ─── Status (uses enum stored as String) ──────────────────────────────

    @Builder.Default
    @Convert(converter = com.safereturn.in.enums.SightingStatusConverter.class)
    @Column(nullable = false, length = 30)
    private SightingStatus status = SightingStatus.PENDING_VERIFICATION;

    @Builder.Default
    @Column(nullable = false)
    private boolean verified = false;

    // ─── Verification ─────────────────────────────────────────────────────

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /** The report owner who confirmed or rejected the sighting */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_id")
    private User verifiedBy;

    // ─── Reward ───────────────────────────────────────────────────────────

    @Builder.Default
    @Column(name = "reward_offered")
    private boolean rewardOffered = false;

    @Column(name = "reward_amount")
    private Long rewardAmount;

    @Builder.Default
    @Column(name = "reward_provided")
    private boolean rewardProvided = false;

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