package com.safereturn.in.service;

import com.safereturn.in.dto.AlertNotificationDto;
import com.safereturn.in.entity.AlertNotification;
import com.safereturn.in.entity.MissingPersonReport;
import com.safereturn.in.entity.SightingReport;
import com.safereturn.in.entity.User;
import com.safereturn.in.repository.AlertNotificationRepository;
import com.safereturn.in.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertNotificationRepository alertRepo;
    private final UserRepository              userRepo;
    private final ReportMapper                mapper;

    public AlertService(AlertNotificationRepository alertRepo,
                        UserRepository userRepo,
                        ReportMapper mapper) {
        this.alertRepo = alertRepo;
        this.userRepo  = userRepo;
        this.mapper    = mapper;
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AlertNotificationDto> getAlertsForUser(String userEmail) {
        User user = findUser(userEmail);
        return alertRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
            .stream()
            .map(mapper::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = findUser(userEmail);
        return alertRepo.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void markAllRead(String userEmail) {
        User user = findUser(userEmail);
        alertRepo.markAllReadForUser(user.getId());
    }

    // ─── Internal factory methods called by MissingPersonService / SightingService

    /**
     * Called when a user successfully submits a missing person report.
     */
    @Transactional
    public void createReportSubmittedAlert(User user, MissingPersonReport report) {
        long reward = report.getRewardAmount() != null ? report.getRewardAmount() : 0L;
        String subtitle = report.getAddress() != null ? report.getAddress() : report.getCity();
        if (reward > 0) subtitle = subtitle + " • Reward ₹" + reward;

        AlertNotification alert = AlertNotification.builder()
            .user(user)
            .missingReport(report)
            .type("Updates")
            .title(report.getFullName() + " report submitted successfully")
            .subtitle(subtitle)
            .status(reward > 0 ? "REWARD ADDED" : "PUBLISHED")
            .isRead(false)
            .build();

        alertRepo.save(alert);
        log.info("Report-submitted alert created for userId={}", user.getId());
    }

    /**
     * Called when a sighting is submitted — notifies the original report owner.
     */
    @Transactional
    public void createSightingAlert(User reportOwner,
                                    SightingReport sighting,
                                    MissingPersonReport missingReport) {
        // Don't create duplicate alert if the sighting submitter IS the report owner
        if (reportOwner.getId().equals(
                sighting.getUser() != null ? sighting.getUser().getId() : -1L)) {
            return;
        }

        AlertNotification alert = AlertNotification.builder()
            .user(reportOwner)
            .missingReport(missingReport)
            .sightingReport(sighting)
            .type("Sightings")
            .title("New sighting reported for " + missingReport.getFullName())
            .subtitle(sighting.getLocation() != null
                      ? sighting.getLocation() : "Location not provided")
            .status("NEW SIGHTING")
            .isRead(false)
            .build();

        alertRepo.save(alert);
        log.info("Sighting alert created for reportOwnerUserId={}", reportOwner.getId());
    }

    /**
     * Called to confirm to the sighting submitter that their sighting was saved.
     */
    @Transactional
    public void createSightingSubmittedAlert(User submitter,
                                             SightingReport sighting,
                                             MissingPersonReport missingReport) {
        AlertNotification alert = AlertNotification.builder()
            .user(submitter)
            .missingReport(missingReport)
            .sightingReport(sighting)
            .type("Updates")
            .title("Sighting for " + missingReport.getFullName() + " submitted")
            .subtitle("Your sighting report has been saved and linked to the case.")
            .status("SUBMITTED")
            .isRead(false)
            .build();

        alertRepo.save(alert);
    }

    /**
     * Called when a sighting is verified (confirmed or rejected) to notify the submitter.
     */
    @Transactional
    public void createSightingVerifiedAlert(User submitter,
                                             SightingReport sighting,
                                             boolean confirmed,
                                             boolean rewardOffered,
                                             Long rewardAmount) {
        if (submitter == null) return;

        String title = confirmed 
            ? "Sighting for " + sighting.getMissingReport().getFullName() + " CONFIRMED!" 
            : "Sighting for " + sighting.getMissingReport().getFullName() + " marked Not Found";

        String subtitle = confirmed
            ? "Thank you for your valuable contribution. The report owner has confirmed your sighting."
            : "Dear friend, thank you so much for your kind effort and care in reporting this sighting. I personally visited the location you mentioned, but unfortunately could not find the missing person there. Your compassion and willingness to help means the world to us. Please continue to keep an eye out — every sighting brings us closer to hope. 🙏";

        if (confirmed && rewardOffered && rewardAmount != null && rewardAmount > 0) {
            subtitle += " You are eligible for a reward of ₹" + rewardAmount + ".";
        }

        AlertNotification alert = AlertNotification.builder()
            .user(submitter)
            .missingReport(sighting.getMissingReport())
            .sightingReport(sighting)
            .type("Updates")
            .title(title)
            .subtitle(subtitle)
            .status(confirmed ? "CONFIRMED" : "NOT_FOUND")
            .isRead(false)
            .build();

        alertRepo.save(alert);
    }

    /**
     * Called when a missing person report is published to notify users in the same location area.
     */
    @Transactional
    public void createNearbyUserAlert(User nearbyUser, MissingPersonReport report) {
        if (nearbyUser == null || report == null) return;

        AlertNotification alert = AlertNotification.builder()
            .user(nearbyUser)
            .missingReport(report)
            .type("Community")
            .title("Missing person reported nearby: " + report.getFullName())
            .subtitle("Last seen at " + report.getAddress() + ". Click for details and help search.")
            .status("NEARBY ALERT")
            .isRead(false)
            .build();

        alertRepo.save(alert);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepo.findByEmail(email.toLowerCase())
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}