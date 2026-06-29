package com.safereturn.in.service;

import com.safereturn.in.dto.DashboardStatsDto;
import com.safereturn.in.repository.MissingPersonReportRepository;
import com.safereturn.in.repository.SightingReportRepository;
import com.safereturn.in.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final MissingPersonReportRepository reportRepo;
    private final SightingReportRepository      sightingRepo;
    private final UserRepository                userRepo;

    public DashboardService(MissingPersonReportRepository reportRepo,
                            SightingReportRepository sightingRepo,
                            UserRepository userRepo) {
        this.reportRepo   = reportRepo;
        this.sightingRepo = sightingRepo;
        this.userRepo     = userRepo;
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getStats() {
        long reported  = reportRepo.count();
        long sightings = sightingRepo.count();
        long found     = reportRepo.countByStatusIgnoreCase("found")
                       + reportRepo.countByStatusIgnoreCase("safe");
        long members   = userRepo.count();

        // Reward stats
        long rewardReports = reportRepo.findAllByOrderByCreatedAtDesc(
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE))
            .getContent()
            .stream()
            .filter(r -> r.getRewardAmount() != null && r.getRewardAmount() > 0)
            .count();

        long totalRewardAmount = reportRepo.findAllByOrderByCreatedAtDesc(
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE))
            .getContent()
            .stream()
            .mapToLong(r -> r.getRewardAmount() != null ? r.getRewardAmount() : 0L)
            .sum();

        return new DashboardStatsDto(reported, sightings, found, members,
                                    rewardReports, totalRewardAmount);
    }
}