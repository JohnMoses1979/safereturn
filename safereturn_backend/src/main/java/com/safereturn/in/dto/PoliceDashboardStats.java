package com.safereturn.in.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PoliceDashboardStats {
    private long totalReports;
    private long solvedReports;
    private long urgentReports;
    private long pendingSightings;
    private long todayReports;
}