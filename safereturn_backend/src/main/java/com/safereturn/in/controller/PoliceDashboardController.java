package com.safereturn.in.controller;

import com.safereturn.in.dto.*;
import com.safereturn.in.service.PoliceDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/police")
@PreAuthorize("hasAnyRole('POLICE', 'ADMIN')")
public class PoliceDashboardController {
    
    private final PoliceDashboardService policeDashboardService;
    
    public PoliceDashboardController(PoliceDashboardService policeDashboardService) {
        this.policeDashboardService = policeDashboardService;
    }
    
    @GetMapping("/dashboard/stats")
    public ResponseEntity<PoliceDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(policeDashboardService.getDashboardStats());
    }
    
    @GetMapping("/reports/all")
    public ResponseEntity<PagedResponse<MissingPersonReportDto>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(policeDashboardService.getAllReports(page, size));
    }
    
    @GetMapping("/reports/pending-verification")
    public ResponseEntity<List<MissingPersonReportDto>> getPendingReports() {
        return ResponseEntity.ok(policeDashboardService.getPendingReports());
    }
    
    @PostMapping("/reports/{id}/verify")
    public ResponseEntity<?> verifyReport(@PathVariable Long id, 
                                         @RequestParam boolean approved) {
        policeDashboardService.verifyReport(id, approved);
        return ResponseEntity.ok(Map.of("message", "Report verified successfully"));
    }
    
    @GetMapping("/sightings/pending")
    public ResponseEntity<List<SightingReportDto>> getPendingSightings() {
        return ResponseEntity.ok(policeDashboardService.getPendingSightings());
    }
    
    @PostMapping("/sightings/{id}/verify")
    public ResponseEntity<?> verifySighting(@PathVariable Long id,
                                           @RequestParam String status) {
        policeDashboardService.verifySighting(id, status);
        return ResponseEntity.ok(Map.of("message", "Sighting verified successfully"));
    }
    
    @GetMapping("/analytics/trends")
    public ResponseEntity<AnalyticsData> getAnalyticsTrends() {
        return ResponseEntity.ok(policeDashboardService.getAnalyticsTrends());
    }
    
    @PostMapping("/face/search")
    public ResponseEntity<FaceMatchResponse> searchFace(
            @RequestPart("photo") MultipartFile photo) {
        FaceMatchResponse response = policeDashboardService.searchFace(photo);
        return ResponseEntity.ok(response);
    }
}