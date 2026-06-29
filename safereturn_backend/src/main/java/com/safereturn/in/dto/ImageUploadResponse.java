package com.safereturn.in.dto;

import java.time.LocalDateTime;

/**
 * Returned after a successful image upload.
 * The `url` field is what gets stored in the DB and sent back to the frontend.
 */
public record ImageUploadResponse(
    String url,
    String filename,
    String originalFilename,
    String contentType,
    String storagePath,
    long sizeBytes,
    LocalDateTime uploadedAt
) {}
