package com.safereturn.in.service;

import com.safereturn.in.dto.MissingPersonReportDto;
import com.safereturn.in.entity.MissingPersonReport;
import com.safereturn.in.entity.SavedReport;
import com.safereturn.in.entity.User;
import com.safereturn.in.repository.MissingPersonReportRepository;
import com.safereturn.in.repository.SavedReportRepository;
import com.safereturn.in.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class SavedReportService {

    private final SavedReportRepository         savedRepo;
    private final MissingPersonReportRepository reportRepo;
    private final UserRepository                userRepo;
    private final ReportMapper                  mapper;

    public SavedReportService(SavedReportRepository savedRepo,
                              MissingPersonReportRepository reportRepo,
                              UserRepository userRepo,
                              ReportMapper mapper) {
        this.savedRepo  = savedRepo;
        this.reportRepo = reportRepo;
        this.userRepo   = userRepo;
        this.mapper     = mapper;
    }

    @Transactional(readOnly = true)
    public List<MissingPersonReportDto> getSavedReports(String userEmail) {
        User user = findUser(userEmail);
        return savedRepo.findByUserIdOrderBySavedAtDesc(user.getId())
            .stream()
            .map(sr -> mapper.toDto(sr.getMissingReport()))
            .toList();
    }

    /**
     * Toggle save/unsave. Returns {"saved": true/false}.
     */
    @Transactional
    public Map<String, Boolean> toggle(String userEmail, Long reportId) {
        User user = findUser(userEmail);

        MissingPersonReport report = reportRepo.findById(reportId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Report not found: " + reportId));

        boolean alreadySaved = savedRepo.existsByUserIdAndMissingReportId(user.getId(), reportId);

        if (alreadySaved) {
            savedRepo.deleteByUserIdAndMissingReportId(user.getId(), reportId);
            return Map.of("saved", false);
        } else {
            SavedReport saved = SavedReport.builder()
                .user(user)
                .missingReport(report)
                .build();
            savedRepo.save(saved);
            return Map.of("saved", true);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Boolean> isSaved(String userEmail, Long reportId) {
        User user = findUser(userEmail);
        boolean saved = savedRepo.existsByUserIdAndMissingReportId(user.getId(), reportId);
        return Map.of("saved", saved);
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email.toLowerCase())
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}