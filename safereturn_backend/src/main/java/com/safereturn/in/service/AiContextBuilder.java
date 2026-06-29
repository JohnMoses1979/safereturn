package com.safereturn.in.service;

import com.safereturn.in.dto.MissingPersonReportDto;
import com.safereturn.in.entity.User;
import com.safereturn.in.repository.AlertNotificationRepository;
import com.safereturn.in.repository.MissingPersonReportRepository;
import com.safereturn.in.repository.SavedReportRepository;
import com.safereturn.in.repository.SightingReportRepository;
import com.safereturn.in.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * AiContextBuilder
 *
 * Analyses the user's message, decides which data domains are relevant,
 * queries ONLY those repositories (never the whole database), and builds
 * a compact, structured text block that is injected into the LLM system
 * prompt.
 *
 * Design principles:
 *  - Lazy / intent-driven: only load data that the question actually needs.
 *  - Bounded: list results are capped (e.g., 10 items) to keep prompt size small.
 *  - User-scoped: personal data (my reports, saved, alerts) is always filtered
 *    by the authenticated user's ID — never another user's data.
 *  - Service-layer agnostic: reads directly from repositories so it can stay
 *    read-only and transactional without coupling to mutable service methods.
 */
@Component
public class AiContextBuilder {

    private static final Logger log = LoggerFactory.getLogger(AiContextBuilder.class);
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    // ── Intent categories ────────────────────────────────────────────────────

    public enum Intent {
        DASHBOARD,      // overall stats
        MY_REPORTS,     // current user's own missing-person reports
        COMMUNITY,      // community (other users') reports
        SIGHTINGS,      // sighting reports — global counts or today's
        MY_SIGHTINGS,   // sightings submitted by current user
        ALERTS,         // alert count / recent alerts for current user
        SAVED,          // saved persons for current user
        RESOLVED,       // resolved / found reports
        REWARD,         // reward-related queries
        GENERAL         // no specific DB data needed
    }

    // ── Collaborators ────────────────────────────────────────────────────────

    private final MissingPersonReportRepository reportRepo;
    private final SightingReportRepository      sightingRepo;
    private final AlertNotificationRepository   alertRepo;
    private final SavedReportRepository         savedRepo;
    private final UserRepository                userRepo;
    private final ReportMapper                  mapper;

    public AiContextBuilder(
            MissingPersonReportRepository reportRepo,
            SightingReportRepository sightingRepo,
            AlertNotificationRepository alertRepo,
            SavedReportRepository savedRepo,
            UserRepository userRepo,
            ReportMapper mapper) {
        this.reportRepo   = reportRepo;
        this.sightingRepo = sightingRepo;
        this.alertRepo    = alertRepo;
        this.savedRepo    = savedRepo;
        this.userRepo     = userRepo;
        this.mapper       = mapper;
    }

    // ── Public API ───────────────────────────────────────────────────────────

    /**
     * Builds the database context block for the LLM system prompt.
     *
     * @param userEmail  authenticated user's email (from JWT)
     * @param message    the raw user message
     * @return           a BuildResult containing the text context and the
     *                   set of intents that were resolved
     */
    public BuildResult build(String userEmail, String message) {
        User user = findUser(userEmail);
        Set<Intent> intents = detectIntents(message);

        log.debug("AI context intents for user={} message='{}': {}",
                  userEmail, message, intents);

        StringBuilder sb = new StringBuilder();
        sb.append("=== LIVE DATABASE CONTEXT ===\n");
        sb.append("Current date: ").append(LocalDate.now().format(DATE_FMT)).append("\n");
        sb.append("Authenticated user: ").append(user.getFullName())
          .append(" (id=").append(user.getId()).append(")\n\n");

        for (Intent intent : intents) {
            try {
                switch (intent) {
                    case DASHBOARD    -> appendDashboard(sb);
                    case MY_REPORTS   -> appendMyReports(sb, user);
                    case COMMUNITY    -> appendCommunitySnapshot(sb, user);
                    case SIGHTINGS    -> appendSightings(sb);
                    case MY_SIGHTINGS -> appendMySightings(sb, user);
                    case ALERTS       -> appendAlerts(sb, user);
                    case SAVED        -> appendSaved(sb, user);
                    case RESOLVED     -> appendResolved(sb);
                    case REWARD       -> appendReward(sb);
                    case GENERAL      -> { /* no data needed */ }
                }
            } catch (Exception e) {
                log.warn("Failed to build context for intent={}: {}", intent, e.getMessage());
                sb.append("[").append(intent).append(": data unavailable]\n");
            }
        }

        sb.append("=== END CONTEXT ===\n");
        return new BuildResult(sb.toString(), intents);
    }

    // ── Intent detection ─────────────────────────────────────────────────────

    /**
     * Simple keyword-based intent detection.
     * Multiple intents can fire for one message (e.g., "my resolved reports").
     */
    private Set<Intent> detectIntents(String message) {
        String m = message.toLowerCase(Locale.ENGLISH);
        Set<Intent> intents = EnumSet.noneOf(Intent.class);

        // Dashboard / stats
        if (contains(m, "stat", "dashboard", "overview", "total", "count",
                        "how many", "summary", "number of")) {
            intents.add(Intent.DASHBOARD);
        }

        // My reports
        if (contains(m, "my report", "i reported", "my missing", "i submitted",
                        "cases i", "reports i")) {
            intents.add(Intent.MY_REPORTS);
        }

        // Sightings — today
        if (contains(m, "today", "sighting today", "reported today")) {
            intents.add(Intent.SIGHTINGS);
        }

        // Sightings — general
        if (contains(m, "sighting", "spotted", "seen", "witness")) {
            intents.add(Intent.SIGHTINGS);
        }

        // My sightings
        if (contains(m, "my sighting", "sighting i", "i submitted a sighting",
                        "sightings i reported")) {
            intents.add(Intent.MY_SIGHTINGS);
        }

        // Alerts
        if (contains(m, "alert", "notification", "unread", "inbox")) {
            intents.add(Intent.ALERTS);
        }

        // Saved
        if (contains(m, "saved", "bookmark", "watchlist", "following")) {
            intents.add(Intent.SAVED);
        }

        // Resolved
        if (contains(m, "resolved", "found", "closed", "safe", "returned")) {
            intents.add(Intent.RESOLVED);
        }

        // Reward
        if (contains(m, "reward", "bounty", "payment", "prize", "money")) {
            intents.add(Intent.REWARD);
        }

        // Community — show reports by others
        if (contains(m, "community", "other", "public", "recent report",
                        "active case", "active missing", "unresolved")) {
            intents.add(Intent.COMMUNITY);
        }

        // If nothing matched, treat as general conversation
        if (intents.isEmpty()) {
            intents.add(Intent.GENERAL);
        }

        return intents;
    }

    private static boolean contains(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) return true;
        }
        return false;
    }

    // ── Context section builders ─────────────────────────────────────────────

    private void appendDashboard(StringBuilder sb) {
        long totalReports   = reportRepo.count();
        long totalSightings = sightingRepo.count();
        long found          = reportRepo.countByStatusIgnoreCase("found")
                            + reportRepo.countByStatusIgnoreCase("safe")
                            + reportRepo.countByStatusIgnoreCase("resolved");
        long members        = userRepo.count();

        // Reward stats — bounded page call reused from DashboardService pattern
        var allReports = reportRepo.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        long rewardReports      = allReports.stream()
                .filter(r -> r.getRewardAmount() != null && r.getRewardAmount() > 0).count();
        long totalRewardAmount  = allReports.stream()
                .mapToLong(r -> r.getRewardAmount() != null ? r.getRewardAmount() : 0L).sum();

        sb.append("--- DASHBOARD STATS ---\n");
        sb.append("Total missing person reports: ").append(totalReports).append("\n");
        sb.append("Total sighting reports: ").append(totalSightings).append("\n");
        sb.append("People found/resolved: ").append(found).append("\n");
        sb.append("Registered members: ").append(members).append("\n");
        sb.append("Reports with reward offers: ").append(rewardReports).append("\n");
        sb.append("Total reward pool: ₹").append(totalRewardAmount).append("\n\n");
    }

    private void appendMyReports(StringBuilder sb, User user) {
        var reports = reportRepo.findByUserIdOrderByCreatedAtDesc(user.getId());

        sb.append("--- MY MISSING PERSON REPORTS (").append(reports.size()).append(" total) ---\n");
        if (reports.isEmpty()) {
            sb.append("You have not submitted any missing person reports yet.\n\n");
            return;
        }

        // Show up to 10 most recent
        reports.stream().limit(10).forEach(r -> {
            sb.append("• ").append(r.getFullName())
              .append(" | Age: ").append(r.getAge())
              .append(" | Status: ").append(r.getStatus())
              .append(" | Last seen: ").append(r.getAddress())
              .append(", ").append(r.getCity())
              .append(" | Reported: ").append(formatDate(r.getCreatedAt()))
              .append("\n");
        });

        if (reports.size() > 10) {
            sb.append("  ... and ").append(reports.size() - 10).append(" more.\n");
        }
        sb.append("\n");
    }

    private void appendCommunitySnapshot(StringBuilder sb, User user) {
        var page = reportRepo.findByUserIdNotOrderByCreatedAtDesc(
                user.getId(), PageRequest.of(0, 10));

        sb.append("--- COMMUNITY / ACTIVE MISSING CASES (showing up to 10) ---\n");
        if (page.isEmpty()) {
            sb.append("No community reports found.\n\n");
            return;
        }

        page.getContent().forEach(r -> {
            sb.append("• ").append(r.getFullName())
              .append(" | Age: ").append(r.getAge())
              .append(" | Status: ").append(r.getStatus())
              .append(" | City: ").append(r.getCity())
              .append(" | Reported: ").append(formatDate(r.getCreatedAt()))
              .append("\n");
        });
        sb.append("Total community reports: ").append(page.getTotalElements()).append("\n\n");
    }

    private void appendSightings(StringBuilder sb) {
        long total = sightingRepo.count();

        // Today's sightings — count those created today
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);
        var allSightings = sightingRepo.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        long todayCount = allSightings.stream()
                .filter(s -> s.getCreatedAt() != null
                          && !s.getCreatedAt().isBefore(startOfDay)
                          && s.getCreatedAt().isBefore(endOfDay))
                .count();

        // Recent 5
        var recent = sightingRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5));

        sb.append("--- SIGHTING REPORTS ---\n");
        sb.append("Total sightings ever: ").append(total).append("\n");
        sb.append("Sightings reported today (").append(LocalDate.now().format(DATE_FMT))
          .append("): ").append(todayCount).append("\n");
        sb.append("Recent 5 sightings:\n");
        recent.getContent().forEach(s -> {
            sb.append("  • ").append(
                    s.getMissingReport() != null ? s.getMissingReport().getFullName() : "Unknown")
              .append(" | Location: ").append(s.getLocation())
              .append(" | Status: ").append(s.getStatus())
              .append(" | Reported: ").append(formatDate(s.getCreatedAt()))
              .append("\n");
        });
        sb.append("\n");
    }

    private void appendMySightings(StringBuilder sb, User user) {
        var sightings = sightingRepo.findByUserIdOrderByCreatedAtDesc(user.getId());

        sb.append("--- MY SIGHTING REPORTS (").append(sightings.size()).append(" total) ---\n");
        if (sightings.isEmpty()) {
            sb.append("You have not submitted any sighting reports yet.\n\n");
            return;
        }
        sightings.stream().limit(10).forEach(s -> {
            sb.append("• ")
              .append(s.getMissingReport() != null ? s.getMissingReport().getFullName() : "Unknown")
              .append(" | Location: ").append(s.getLocation())
              .append(" | Status: ").append(s.getStatus())
              .append(" | Date: ").append(formatDate(s.getCreatedAt()))
              .append("\n");
        });
        sb.append("\n");
    }

    private void appendAlerts(StringBuilder sb, User user) {
        long unread  = alertRepo.countByUserIdAndIsReadFalse(user.getId());
        var  alerts  = alertRepo.findByUserIdOrderByCreatedAtDesc(user.getId());

        sb.append("--- ALERTS ---\n");
        sb.append("Total alerts: ").append(alerts.size()).append("\n");
        sb.append("Unread alerts: ").append(unread).append("\n");
        sb.append("Recent 5 alerts:\n");
        alerts.stream().limit(5).forEach(a -> {
            sb.append("  • [").append(a.getType()).append("] ")
              .append(a.getTitle())
              .append(" | ").append(a.isRead() ? "Read" : "Unread")
              .append(" | ").append(formatDate(a.getCreatedAt()))
              .append("\n");
        });
        sb.append("\n");
    }

    private void appendSaved(StringBuilder sb, User user) {
        var saved = savedRepo.findByUserIdOrderBySavedAtDesc(user.getId());

        sb.append("--- SAVED PERSONS (").append(saved.size()).append(" total) ---\n");
        if (saved.isEmpty()) {
            sb.append("You have not saved any missing person reports.\n\n");
            return;
        }
        saved.stream().limit(10).forEach(s -> {
            var r = s.getMissingReport();
            if (r != null) {
                sb.append("• ").append(r.getFullName())
                  .append(" | Age: ").append(r.getAge())
                  .append(" | Status: ").append(r.getStatus())
                  .append(" | City: ").append(r.getCity())
                  .append("\n");
            }
        });
        if (saved.size() > 10) {
            sb.append("  ... and ").append(saved.size() - 10).append(" more.\n");
        }
        sb.append("\n");
    }

    private void appendResolved(StringBuilder sb) {
        var resolved = reportRepo.findByStatusIgnoreCaseOrderByCreatedAtDesc("Resolved");
        var found    = reportRepo.findByStatusIgnoreCaseOrderByCreatedAtDesc("Found");
        var safe     = reportRepo.findByStatusIgnoreCaseOrderByCreatedAtDesc("Safe");

        int total = resolved.size() + found.size() + safe.size();
        sb.append("--- RESOLVED / FOUND CASES ---\n");
        sb.append("Total resolved: ").append(total).append("\n");

        List<com.safereturn.in.entity.MissingPersonReport> all = new ArrayList<>();
        all.addAll(resolved);
        all.addAll(found);
        all.addAll(safe);

        all.stream().limit(10).forEach(r -> {
            sb.append("• ").append(r.getFullName())
              .append(" | Status: ").append(r.getStatus())
              .append(" | City: ").append(r.getCity())
              .append(" | Resolved: ").append(
                      r.getResolvedAt() != null ? formatDate(r.getResolvedAt()) : "N/A")
              .append("\n");
        });
        sb.append("\n");
    }

    private void appendReward(StringBuilder sb) {
        var allReports = reportRepo.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, Integer.MAX_VALUE)).getContent();

        var rewardReports = allReports.stream()
                .filter(r -> r.getRewardAmount() != null && r.getRewardAmount() > 0)
                .limit(10)
                .toList();

        long totalPool = allReports.stream()
                .mapToLong(r -> r.getRewardAmount() != null ? r.getRewardAmount() : 0L)
                .sum();

        sb.append("--- REWARD CASES ---\n");
        sb.append("Reports with active rewards: ").append(rewardReports.size()).append("\n");
        sb.append("Total reward pool: ₹").append(totalPool).append("\n");
        rewardReports.forEach(r -> {
            sb.append("• ").append(r.getFullName())
              .append(" | Reward: ₹").append(r.getRewardAmount())
              .append(" | Status: ").append(r.getStatus())
              .append(" | City: ").append(r.getCity())
              .append("\n");
        });
        sb.append("\n");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepo.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private String formatDate(LocalDateTime dt) {
        if (dt == null) return "N/A";
        return dt.format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));
    }

    // ── Result type ──────────────────────────────────────────────────────────

    /**
     * Carries the built context string and the resolved intent set back to
     * AiChatService so it can populate the contextUsed field in the response.
     */
    public record BuildResult(String contextBlock, Set<Intent> intents) {

        public String intentsAsString() {
            return intents.stream()
                    .map(Enum::name)
                    .reduce((a, b) -> a + "," + b)
                    .orElse("GENERAL");
        }
    }
}