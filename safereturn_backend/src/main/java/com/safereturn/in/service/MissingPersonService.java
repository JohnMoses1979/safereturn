package com.safereturn.in.service;

import com.safereturn.in.dto.CreateMissingReportRequest;
import com.safereturn.in.dto.MissingPersonReportDto;
import com.safereturn.in.dto.PagedResponse;
import com.safereturn.in.entity.MissingPersonReport;
import com.safereturn.in.entity.User;
import com.safereturn.in.repository.MissingPersonReportRepository;
import com.safereturn.in.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MissingPersonService {

    private static final Logger log = LoggerFactory.getLogger(MissingPersonService.class);

    private final MissingPersonReportRepository reportRepo;
    private final UserRepository userRepo;
    private final ReportMapper mapper;
    private final AlertService alertService;
    private final FaceEmbeddingService faceEmbeddingService;

    public MissingPersonService(MissingPersonReportRepository reportRepo,
            UserRepository userRepo,
            ReportMapper mapper,
            AlertService alertService,
            FaceEmbeddingService faceEmbeddingService) {
        this.reportRepo = reportRepo;
        this.userRepo = userRepo;
        this.mapper = mapper;
        this.alertService = alertService;
        this.faceEmbeddingService = faceEmbeddingService;
    }

    // ─── Create ───────────────────────────────────────────────────────────────
    @Transactional
    public MissingPersonReportDto create(String userEmail, CreateMissingReportRequest req) {
        User user = findUser(userEmail);

        MissingPersonReport report = MissingPersonReport.builder()
                .user(user)
                .fullName(req.fullName().trim())
                .age(req.age().trim())
                .gender(req.gender())
                .height(req.height())
                .lastSeenDate(req.lastSeenDate())
                .lastSeenTime(req.lastSeenTime())
                .address(req.address().trim())
                .landmark(req.landmark())
                .city(req.city())
                .state(req.state())
                .pincode(req.pincode())
                .latitude(req.latitude())
                .longitude(req.longitude())
                .physicalDetails(req.physicalDetails().trim())
                .otherDetails(req.otherDetails().trim())
                .complexion(req.complexion() != null ? req.complexion().trim() : null)
                .hairColor(req.hairColor() != null ? req.hairColor().trim() : null)
                .eyeColor(req.eyeColor() != null ? req.eyeColor().trim() : null)
                .bodyType(req.bodyType() != null ? req.bodyType().trim() : null)
                .weight(req.weight() != null ? req.weight().trim() : null)
                .reporterName(req.reporterName().trim())
                .relationship(req.relationship())
                .phoneNumber(req.phoneNumber())
                .emailAddress(req.emailAddress())
                .rewardAmount(req.rewardAmount() != null && req.rewardAmount() > 0
                        ? req.rewardAmount() : 0L)
                .photoUrl(req.photoUrl())
                .extraPhotoUrls(joinUrls(req.extraPhotoUrls()))
                .status("Published")
                .build();

        MissingPersonReport saved = reportRepo.save(report);

        if (saved.getPhotoUrl() != null && !saved.getPhotoUrl().isBlank()) {
            try {
                faceEmbeddingService.saveEmbedding(saved);
            } catch (Exception e) {
                log.error("Face embedding failed for reportId={}: {} — report saved normally",
                        saved.getId(), e.getMessage());
            }
        }

        // Create an alert for the reporting user confirming the submission
        alertService.createReportSubmittedAlert(user, saved);

        // Send nearby-user alerts based on location matches
        try {
            notifyNearbyUsers(saved, user);
        } catch (Exception e) {
            log.error("Failed to notify nearby users for report id={}: {}", saved.getId(), e.getMessage());
        }

        log.info("Missing person report created. id={} by userId={}", saved.getId(), user.getId());
        return mapper.toDto(saved);
    }

    private void notifyNearbyUsers(MissingPersonReport report, User creator) {
        java.util.Set<User> nearby = new java.util.HashSet<>();
        if (report.getPincode() != null && !report.getPincode().isBlank()) {
            nearby.addAll(userRepo.findByPincode(report.getPincode().trim()));
        }
        if (report.getLandmark() != null && !report.getLandmark().isBlank()) {
            nearby.addAll(userRepo.findByLocality(report.getLandmark().trim()));
        }
        if (report.getCity() != null && !report.getCity().isBlank()) {
            nearby.addAll(userRepo.findByCity(report.getCity().trim()));
        }
        if (report.getState() != null && !report.getState().isBlank()) {
            nearby.addAll(userRepo.findByState(report.getState().trim()));
        }

        // Exclude the creator
        nearby.remove(creator);

        log.info("Found {} nearby users to notify for missing report id={}", nearby.size(), report.getId());
        for (User u : nearby) {
            alertService.createNearbyUserAlert(u, report);
        }
    }

    // ─── Read all (public) ────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PagedResponse<MissingPersonReportDto> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MissingPersonReport> pg = reportRepo.findAllByOrderByCreatedAtDesc(pageable);
        return toPagedResponse(pg);
    }

    // ─── Read one ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public MissingPersonReportDto getById(Long id) {
        MissingPersonReport report = reportRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                "Report not found with id: " + id));
        return mapper.toDto(report);
    }

    // ─── My Reports ───────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MissingPersonReportDto> getMyReports(String userEmail) {
        User user = findUser(userEmail);
        return reportRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(mapper::toDto)
                .toList();
    }

    // ─── Community Reports ────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PagedResponse<MissingPersonReportDto> getCommunityReports(String userEmail, int page, int size) {
        User user = findUser(userEmail);
        Pageable pageable = PageRequest.of(page, size);
        Page<MissingPersonReport> pg = reportRepo.findByUserIdNotOrderByCreatedAtDesc(user.getId(), pageable);
        return toPagedResponse(pg);
    }

    // ─── Search ───────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PagedResponse<MissingPersonReportDto> search(String query, int page, int size) {
        if (query == null || query.isBlank()) {
            return getAll(page, size);
        }
        Pageable pageable = PageRequest.of(page, size);
        Page<MissingPersonReport> pg = reportRepo.search(query.trim(), pageable);
        return toPagedResponse(pg);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    private User findUser(String email) {
        return userRepo.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private String joinUrls(java.util.List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            return null;
        }
        return String.join(",", urls.stream().filter(u -> u != null && !u.isBlank()).toList());
    }

    private PagedResponse<MissingPersonReportDto> toPagedResponse(Page<MissingPersonReport> pg) {
        List<MissingPersonReportDto> content = pg.getContent()
                .stream()
                .map(mapper::toDto)
                .toList();
        return new PagedResponse<>(
                content,
                pg.getNumber(),
                pg.getSize(),
                pg.getTotalElements(),
                pg.getTotalPages(),
                pg.isLast()
        );
    }
}
