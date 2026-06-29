package com.safereturn.in.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.safereturn.in.dto.MissingPersonReportDto;
import com.safereturn.in.service.SavedReportService;

/**
 * Saved report endpoints:
 *
 *   GET    /api/saved                 — List all saved reports for current user
 *   POST   /api/saved/{reportId}      — Toggle save/unsave
 *   GET    /api/saved/{reportId}/check — Check if a report is saved
 */
@RestController
@RequestMapping("/api/saved")
public class SavedReportController {

    private final SavedReportService savedService;

    public SavedReportController(SavedReportService savedService) {
        this.savedService = savedService;
    }

    @GetMapping
    public ResponseEntity<List<MissingPersonReportDto>> getSaved(Authentication auth) {
        return ResponseEntity.ok(savedService.getSavedReports(auth.getName()));
    }

    @PostMapping("/{reportId}")
    public ResponseEntity<Map<String, Boolean>> toggle(
        Authentication auth,
        @PathVariable Long reportId
    ) {
        return ResponseEntity.ok(savedService.toggle(auth.getName(), reportId));
    }

    @GetMapping("/{reportId}/check")
    public ResponseEntity<Map<String, Boolean>> isSaved(
        Authentication auth,
        @PathVariable Long reportId
    ) {
        return ResponseEntity.ok(savedService.isSaved(auth.getName(), reportId));
    }
}