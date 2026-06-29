package com.safereturn.in.controller;

import com.safereturn.in.dto.CreateSightingReportRequest;
import com.safereturn.in.dto.PagedResponse;
import com.safereturn.in.dto.SightingReportDto;
import com.safereturn.in.service.SightingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Sighting report endpoints:
 *
 *   POST   /api/reports/sightings                          — Submit a sighting
 *   GET    /api/reports/sightings                          — All sightings, paginated
 *   GET    /api/reports/sightings/missing/{missingReportId} — Sightings for one missing report
 */
@RestController
@RequestMapping("/api/reports/sightings")
public class SightingController {

    private final SightingService service;

    public SightingController(SightingService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SightingReportDto> create(
        Authentication auth,
        @Valid @RequestBody CreateSightingReportRequest request
    ) {
        SightingReportDto dto = service.create(auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping
    public ResponseEntity<PagedResponse<SightingReportDto>> getAll(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.getAll(page, Math.min(size, 100)));
    }

    @GetMapping("/missing/{missingReportId}")
    public ResponseEntity<List<SightingReportDto>> getByMissingReport(
        @PathVariable Long missingReportId
    ) {
        return ResponseEntity.ok(service.getByMissingReport(missingReportId));
    }

    @PutMapping("/{id}/under-review")
    public ResponseEntity<SightingReportDto> moveToUnderReview(
        Authentication auth,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(service.moveToUnderReview(id, auth.getName()));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<SightingReportDto> verifySighting(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody com.safereturn.in.dto.VerifySightingRequest request
    ) {
        return ResponseEntity.ok(service.verifySighting(id, auth.getName(), request));
    }
}