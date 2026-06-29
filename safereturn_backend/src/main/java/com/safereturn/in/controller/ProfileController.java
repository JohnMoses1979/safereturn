








package com.safereturn.in.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.safereturn.in.dto.UpdateProfileRequest;
import com.safereturn.in.dto.UserDto;
import com.safereturn.in.service.ProfileService;

import jakarta.validation.Valid;

/**
 * Profile endpoints (all require a valid Bearer JWT):
 *
 *   GET  /api/profile   — return the current user's profile
 *   PUT  /api/profile   — update the current user's profile
 *
 * The authenticated user's email is extracted from the JWT via Spring Security's
 * Authentication object, so one user can NEVER touch another user's profile.
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /** GET /api/profile — fetch current user's profile. */
    @GetMapping
    public ResponseEntity<UserDto> getProfile(Authentication authentication) {
        String email = authentication.getName();
        UserDto dto  = profileService.getProfile(email);
        return ResponseEntity.ok(dto);
    }

    /** PUT /api/profile — update current user's profile. */
    @PutMapping
    public ResponseEntity<UserDto> updateProfile(
        Authentication authentication,
        @Valid @RequestBody UpdateProfileRequest request
    ) {
        String email = authentication.getName();
        UserDto updated = profileService.updateProfile(email, request);
        return ResponseEntity.ok(updated);
    }
}