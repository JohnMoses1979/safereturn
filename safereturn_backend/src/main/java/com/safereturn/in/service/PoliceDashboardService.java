package com.safereturn.in.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.safereturn.in.client.FaceApiClient;
import com.safereturn.in.dto.AnalyticsData;
import com.safereturn.in.dto.FaceMatchResponse;
import com.safereturn.in.dto.MissingPersonReportDto;
import com.safereturn.in.dto.PagedResponse;
import com.safereturn.in.dto.PoliceDashboardStats;
import com.safereturn.in.dto.SightingReportDto;
import com.safereturn.in.entity.MissingPersonReport;
import com.safereturn.in.entity.SightingReport;
import com.safereturn.in.enums.SightingStatus;
import com.safereturn.in.repository.MissingPersonReportRepository;
import com.safereturn.in.repository.SightingReportRepository;
import com.safereturn.in.repository.UserRepository;

@Service
public class PoliceDashboardService {

    private final MissingPersonReportRepository reportRepo;
    private final SightingReportRepository sightingRepo;
    private final UserRepository userRepo;
    private final FaceApiClient faceApiClient;
    private final ReportMapper mapper;
    private final AiFaceMatchService aiFaceMatchService; // ← ADDED

    public PoliceDashboardService(MissingPersonReportRepository reportRepo,
                                  SightingReportRepository sightingRepo,
                                  UserRepository userRepo,
                                  FaceApiClient faceApiClient,
                                  ReportMapper mapper,
                                  AiFaceMatchService aiFaceMatchService) { // ← ADDED
        this.reportRepo = reportRepo;
        this.sightingRepo = sightingRepo;
        this.userRepo = userRepo;
        this.faceApiClient = faceApiClient;
        this.mapper = mapper;
        this.aiFaceMatchService = aiFaceMatchService; // ← ADDED
    }

    @Transactional(readOnly = true)
    public PoliceDashboardStats getDashboardStats() {
        long totalReports = reportRepo.count();
        long solvedReports = reportRepo.countByStatusIgnoreCase("Resolved")
                + reportRepo.countByStatusIgnoreCase("Found");
        long urgentReports = reportRepo.countByStatusIgnoreCase("Published");
        long pendingSightings = sightingRepo.findByStatus(SightingStatus.PENDING_VERIFICATION).size();

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        long todayReports = reportRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 1000))
                .getContent().stream()
                .filter(r -> !r.getCreatedAt().isBefore(startOfDay))
                .count();

        return PoliceDashboardStats.builder()
                .totalReports(totalReports)
                .solvedReports(solvedReports)
                .urgentReports(urgentReports)
                .pendingSightings(pendingSightings)
                .todayReports(todayReports)
                .build();
    }

    @Transactional(readOnly = true)
    public PagedResponse<MissingPersonReportDto> getAllReports(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MissingPersonReport> pg = reportRepo.findAllByOrderByCreatedAtDesc(pageable);
        List<MissingPersonReportDto> content = pg.getContent().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
        return new PagedResponse<>(
                content,
                pg.getNumber(),
                pg.getSize(),
                pg.getTotalElements(),
                pg.getTotalPages(),
                pg.isLast()
        );
    }

    @Transactional(readOnly = true)
    public List<MissingPersonReportDto> getPendingReports() {
        // In your system, reports are auto-published. Return recent reports for police review.
        return reportRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 50))
                .getContent().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void verifyReport(Long id, boolean approved) {
        MissingPersonReport report = reportRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));
        // Your system uses "Published" and "Resolved" — no "Rejected" status
        if (approved) {
            report.setStatus("Published");
        } else {
            // Mark as resolved with note instead of non-existent "Rejected"
            report.setStatus("Resolved");
            report.setResolvedAt(LocalDateTime.now());
        }
        reportRepo.save(report);
    }

    @Transactional(readOnly = true)
    public List<SightingReportDto> getPendingSightings() {
        // ✅ FIX: Filter only pending sightings
        return sightingRepo.findByStatus(SightingStatus.PENDING_VERIFICATION)
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void verifySighting(Long id, String status) {
        SightingReport sighting = sightingRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sighting not found: " + id));

        // ✅ FIX: Convert String to SightingStatus enum
        SightingStatus newStatus;
        try {
            newStatus = SightingStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status
                    + ". Must be one of: PENDING_VERIFICATION, UNDER_REVIEW, CONFIRMED, NOT_FOUND");
        }

        sighting.setStatus(newStatus);

        // If confirmed, mark as verified
        if (newStatus == SightingStatus.CONFIRMED) {
            sighting.setVerified(true);
            sighting.setVerifiedAt(LocalDateTime.now());
        }

        sightingRepo.save(sighting);
    }

    @Transactional(readOnly = true)
    public AnalyticsData getAnalyticsTrends() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<MissingPersonReport> allReports = reportRepo.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, 1000)).getContent();
        List<SightingReport> allSightings = sightingRepo.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, 1000)).getContent();

        int[] dailyReports = new int[7];
        int[] dailySightings = new int[7];

        for (int i = 0; i < 7; i++) {
            LocalDateTime dayStart = sevenDaysAgo.plusDays(i);
            LocalDateTime dayEnd = dayStart.plusDays(1);

            dailyReports[i] = (int) allReports.stream()
                    .filter(r -> !r.getCreatedAt().isBefore(dayStart)
                            && r.getCreatedAt().isBefore(dayEnd))
                    .count();
            dailySightings[i] = (int) allSightings.stream()
                    .filter(s -> !s.getCreatedAt().isBefore(dayStart)
                            && s.getCreatedAt().isBefore(dayEnd))
                    .count();
        }

        return AnalyticsData.builder()
                .dailyReports(dailyReports)
                .dailySightings(dailySightings)
                .totalUsers(userRepo.count())
                .build();
    }

    /**
     * ✅ FIX: Delegate to AiFaceMatchService which already has complete
     * face-matching logic (embedding cache, distance calculation, etc.)
     */
    @Transactional
    public FaceMatchResponse searchFace(MultipartFile queryImage) {
        return aiFaceMatchService.search(queryImage);
    }
}