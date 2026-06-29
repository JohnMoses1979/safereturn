package com.safereturn.in.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "alert_notifications",
    indexes = {
        @Index(name = "idx_an_user_id",     columnList = "user_id"),
        @Index(name = "idx_an_report_id",   columnList = "missing_report_id"),
        @Index(name = "idx_an_created_at",  columnList = "created_at"),
        @Index(name = "idx_an_is_read",     columnList = "is_read")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AlertNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    /** The user who should receive this alert */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The missing person report this alert relates to (nullable for system alerts) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "missing_report_id")
    private MissingPersonReport missingReport;

    /** The sighting that triggered this alert (nullable) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sighting_report_id")
    private SightingReport sightingReport;

    /** Type: "Sightings", "Updates", "Community" */
    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String subtitle;

    /** Status label shown on the alert card */
    @Column(length = 30)
    private String status;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}