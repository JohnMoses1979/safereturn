package com.safereturn.in.controller;

import com.safereturn.in.dto.ImageUploadResponse;
import com.safereturn.in.service.ImageStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;

/**
 * Image endpoints:
 *
 *   POST /api/images/upload   - Upload one image; returns metadata and a public URL
 *   GET  /api/images/**       - Serve an image file (public, no auth required)
 */
@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final ImageStorageService storageService;

    public ImageController(ImageStorageService storageService) {
        this.storageService = storageService;
    }

    /**
     * POST /api/images/upload
     * Requires Bearer JWT (authenticated users only).
     * Returns the public URL to store in the report.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> upload(
        @RequestParam("file") MultipartFile file
    ) {
        ImageUploadResponse response = storageService.store(file);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/images/{...}
     * Serves the image file. This endpoint is public (no JWT required).
     * Added to permit-list in SecurityConfig.
     */
    @GetMapping("/{*filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path file = storageService.load(filename);
            Resource resource = new UrlResource(file.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = determineContentType(filename);

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .body(resource);

        } catch (MalformedURLException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String determineContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        return "image/jpeg";
    }
}
