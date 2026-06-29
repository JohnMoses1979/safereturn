package com.safereturn.in.dto;

/**
 * Dashboard statistics returned by GET /api/dashboard/stats
 */
public record DashboardStatsDto(
    long reported,
    long sightings,
    long found,
    long members,
    long rewardReports,
    long totalRewardAmount
) {}