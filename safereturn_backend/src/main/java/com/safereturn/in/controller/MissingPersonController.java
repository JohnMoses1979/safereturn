package com.safereturn.in.controller;

import com.safereturn.in.dto.CreateMissingReportRequest;
import com.safereturn.in.dto.MissingPersonReportDto;
import com.safereturn.in.dto.PagedResponse;
import com.safereturn.in.service.MissingPersonService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Missing person report endpoints:
 *
 *   POST   /api/reports/missing              — Create a new report (auth required)
 *   GET    /api/reports/missing              — List all reports, paginated (public)
 *   GET    /api/reports/missing/{id}         — Get one report by ID (public)
 *   GET    /api/reports/missing/my           — Get reports submitted by current user
 *   GET    /api/reports/missing/search?q=    — Search reports
 */
@RestController
@RequestMapping("/api/reports/missing")
public class MissingPersonController {

    private final MissingPersonService service;

    public MissingPersonController(MissingPersonService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MissingPersonReportDto> create(
        Authentication auth,
        @Valid @RequestBody CreateMissingReportRequest request
    ) {
        MissingPersonReportDto dto = service.create(auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping
    public ResponseEntity<PagedResponse<MissingPersonReportDto>> getAll(
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.getAll(page, Math.min(size, 100)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MissingPersonReportDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/my")
    public ResponseEntity<List<MissingPersonReportDto>> getMyReports(Authentication auth) {
        return ResponseEntity.ok(service.getMyReports(auth.getName()));
    }

    @GetMapping("/community")
    public ResponseEntity<PagedResponse<MissingPersonReportDto>> getCommunityReports(
        Authentication auth,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.getCommunityReports(auth.getName(), page, Math.min(size, 100)));
    }

    @GetMapping("/search")
    public ResponseEntity<PagedResponse<MissingPersonReportDto>> search(
        @RequestParam String q,
        @RequestParam(defaultValue = "0")  int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.search(q, page, Math.min(size, 100)));
    }
}