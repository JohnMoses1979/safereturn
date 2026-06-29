package com.safereturn.in.controller;

import com.safereturn.in.dto.AlertNotificationDto;
import com.safereturn.in.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Alert endpoints:
 *
 *   GET  /api/alerts          — All alerts for current user
 *   GET  /api/alerts/count    — Unread alert count
 *   POST /api/alerts/read-all — Mark all alerts as read
 */
@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<List<AlertNotificationDto>> getAlerts(Authentication auth) {
        return ResponseEntity.ok(alertService.getAlertsForUser(auth.getName()));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        long count = alertService.getUnreadCount(auth.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(Authentication auth) {
        alertService.markAllRead(auth.getName());
        return ResponseEntity.ok(Map.of("message", "All alerts marked as read."));
    }
}