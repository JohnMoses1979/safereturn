package com.safereturn.in.service;

import com.safereturn.in.dto.CreateSightingReportRequest;
import com.safereturn.in.dto.PagedResponse;
import com.safereturn.in.dto.SightingReportDto;
import com.safereturn.in.dto.VerifySightingRequest;
import com.safereturn.in.entity.MissingPersonReport;
import com.safereturn.in.entity.SightingReport;
import com.safereturn.in.entity.User;
import com.safereturn.in.enums.SightingStatus;
import com.safereturn.in.repository.MissingPersonReportRepository;
import com.safereturn.in.repository.SightingReportRepository;
import com.safereturn.in.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SightingService {

    private static final Logger log = LoggerFactory.getLogger(SightingService.class);

    private final SightingReportRepository sightingRepo;
    private final MissingPersonReportRepository reportRepo;
    private final UserRepository userRepo;
    private final ReportMapper mapper;
    private final AlertService alertService;
    private final FaceEmbeddingService faceEmbeddingService;

    public SightingService(SightingReportRepository sightingRepo,
            MissingPersonReportRepository reportRepo,
            UserRepository userRepo,
            ReportMapper mapper,
            AlertService alertService,
            FaceEmbeddingService faceEmbeddingService) {
        this.sightingRepo = sightingRepo;
        this.reportRepo = reportRepo;
        this.userRepo = userRepo;
        this.mapper = mapper;
        this.alertService = alertService;
        this.faceEmbeddingService = faceEmbeddingService;
    }

    // ─── Create ───────────────────────────────────────────────────────────────
    @Transactional
    public SightingReportDto create(String userEmail, CreateSightingReportRequest req) {
        User user = findUser(userEmail);

        MissingPersonReport missingReport = reportRepo.findById(req.missingReportId())
                .orElseThrow(() -> new IllegalArgumentException(
                "Missing person report not found: " + req.missingReportId()));

        SightingReport sighting = SightingReport.builder()
                .missingReport(missingReport)
                .user(user)
                .seenDate(req.seenDate())
                .seenTime(req.seenTime())
                .location(req.location().trim())
                .latitude(req.latitude())
                .longitude(req.longitude())
                .seenOption(req.seenOption())
                .details(req.details() != null ? req.details().trim() : null)
                .photoUrl(req.photoUrl())
                .contactName(req.contactName() != null ? req.contactName() : user.getFullName())
                .contactPhone(req.contactPhone() != null ? req.contactPhone() : user.getPhone())
                .status(SightingStatus.PENDING_VERIFICATION)
                .verified(false)
                .build();

        SightingReport saved = sightingRepo.save(sighting);

        // Notify the person who originally filed the missing report
        alertService.createSightingAlert(missingReport.getUser(), saved, missingReport);

        // Also confirm to the sighting submitter
        alertService.createSightingSubmittedAlert(user, saved, missingReport);

        log.info("Sighting submitted. id={} for missingReportId={} by userId={}",
                saved.getId(), missingReport.getId(), user.getId());

        return mapper.toDto(saved);
    }

    // ─── Verification & State Transitions ──────────────────────────────────────
    @Transactional
    public SightingReportDto moveToUnderReview(Long sightingId, String userEmail) {
        User user = findUser(userEmail);
        SightingReport sighting = sightingRepo.findById(sightingId)
                .orElseThrow(() -> new IllegalArgumentException("Sighting report not found: " + sightingId));

        MissingPersonReport report = sighting.getMissingReport();
        if (report.getUser() == null || !report.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Only the owner of the missing person report can review this sighting.");
        }

        sighting.setStatus(SightingStatus.UNDER_REVIEW);
        SightingReport saved = sightingRepo.save(sighting);
        return mapper.toDto(saved);
    }

    @Transactional
    public SightingReportDto verifySighting(Long sightingId, String userEmail, VerifySightingRequest req) {
        User user = findUser(userEmail);
        SightingReport sighting = sightingRepo.findById(sightingId)
                .orElseThrow(() -> new IllegalArgumentException("Sighting report not found: " + sightingId));

        MissingPersonReport report = sighting.getMissingReport();
        if (report.getUser() == null || !report.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Only the owner of the missing person report can verify this sighting.");
        }

        boolean isConfirm = "CONFIRM".equalsIgnoreCase(req.action());
        if (isConfirm) {
            sighting.setStatus(SightingStatus.CONFIRMED);
            sighting.setVerified(true);
            sighting.setVerifiedAt(LocalDateTime.now());
            sighting.setVerifiedBy(user);

            if (req.provideReward()) {
                long rewardAmount = req.rewardAmount() != null
                        ? req.rewardAmount()
                        : (report.getRewardAmount() != null ? report.getRewardAmount() : 0L);
                sighting.setRewardOffered(true);
                sighting.setRewardProvided(true);
                sighting.setRewardAmount(rewardAmount);
            } else {
                sighting.setRewardOffered(false);
                sighting.setRewardProvided(false);
                sighting.setRewardAmount(0L);
            }

            // Auto-resolve the missing person report
            report.setStatus("Resolved");
            report.setResolvedAt(LocalDateTime.now());
            reportRepo.save(report);
            report.setStatus("Resolved");
            report.setResolvedAt(LocalDateTime.now());
            reportRepo.save(report);

            try {
                faceEmbeddingService.deleteEmbedding(report.getId());
            } catch (Exception e) {
                log.error("Failed to delete embedding for resolved reportId={}: {}",
                        report.getId(), e.getMessage());
            }

            // Notify submitter of confirmation + reward
            alertService.createSightingVerifiedAlert(sighting.getUser(), sighting, true, req.provideReward(), sighting.getRewardAmount());

        } else {
            sighting.setStatus(SightingStatus.NOT_FOUND);
            sighting.setVerified(false);
            sighting.setVerifiedAt(LocalDateTime.now());
            sighting.setVerifiedBy(user);
            sighting.setRewardOffered(false);
            sighting.setRewardProvided(false);
            sighting.setRewardAmount(0L);

            // Notify submitter of not found status
            alertService.createSightingVerifiedAlert(sighting.getUser(), sighting, false, false, 0L);
        }

        SightingReport saved = sightingRepo.save(sighting);
        return mapper.toDto(saved);
    }

    // ─── Read all (public) ────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PagedResponse<SightingReportDto> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SightingReport> pg = sightingRepo.findAllByOrderByCreatedAtDesc(pageable);
        List<SightingReportDto> content = pg.getContent().stream().map(mapper::toDto).toList();
        return new PagedResponse<>(
                content, pg.getNumber(), pg.getSize(),
                pg.getTotalElements(), pg.getTotalPages(), pg.isLast()
        );
    }

    // ─── Sightings for a specific missing report ──────────────────────────────
    @Transactional(readOnly = true)
    public List<SightingReportDto> getByMissingReport(Long missingReportId) {
        return sightingRepo.findByMissingReportIdOrderByCreatedAtDesc(missingReportId)
                .stream()
                .map(mapper::toDto)
                .toList();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    private User findUser(String email) {
        return userRepo.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
