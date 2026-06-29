package com.safereturn.in.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnalyticsData {
    private int[] dailyReports;
    private int[] dailySightings;
    private long totalUsers;
}