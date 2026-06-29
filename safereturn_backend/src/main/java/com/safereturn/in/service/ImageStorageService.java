package com.safereturn.in.service;

import com.safereturn.in.dto.ImageUploadResponse;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Stores uploaded images on the local filesystem under ${safereturn.upload-dir}.
 * Images are grouped by date and given descriptive names so they are easier to
 * browse, search, and understand later.
 *
 * To migrate to S3/Cloudinary later: replace this service only.
 * The rest of the codebase only ever sees a URL string.
 */
@Service
public class ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(ImageStorageService.class);

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final DateTimeFormatter DATE_FOLDER = DateTimeFormatter.ofPattern("yyyy/MM/dd");
    private static final DateTimeFormatter TIME_STAMP = DateTimeFormatter.ofPattern("HHmmssSSS");

    @Value("${safereturn.upload-dir:uploads}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
            log.info("Image upload directory ready: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + rootLocation, e);
        }
    }

    /**
     * Saves a multipart file and returns a public relative URL.
     * Throws IllegalArgumentException for invalid files.
     */
    public ImageUploadResponse store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty or missing.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException(
                "Invalid file type. Only JPEG, PNG, and WEBP images are allowed.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size must not exceed 5 MB.");
        }

        String originalFilename = StringUtils.cleanPath(
            file.getOriginalFilename() != null ? file.getOriginalFilename() : "image"
        );
        String extension = getExtension(originalFilename, contentType);
        LocalDateTime now = LocalDateTime.now();

        String folderPath = now.format(DATE_FOLDER);
        String baseName = buildBaseName(originalFilename);
        String uniqueSuffix = now.format(TIME_STAMP)
            + "-"
            + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String fileName = baseName + "-" + uniqueSuffix + extension;
        String relativePath = folderPath + "/" + fileName;

        try {
            Path targetPath = rootLocation.resolve(relativePath).normalize();
            if (!targetPath.startsWith(rootLocation)) {
                throw new IllegalArgumentException("Invalid file path.");
            }

            Path parent = targetPath.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String publicUrl = "/api/images/" + relativePath.replace("\\", "/");
            log.info("Image stored: {} -> {}", relativePath, publicUrl);

            return new ImageUploadResponse(
                publicUrl,
                fileName,
                originalFilename,
                contentType,
                relativePath.replace("\\", "/"),
                file.getSize(),
                now
            );

        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to store image. Please try again.");
        }
    }

    /**
     * Returns the Path for a given filename so ImageController can serve it.
     */
    public Path load(String filename) {
        String cleanFilename = filename == null ? "" : filename.trim().replaceFirst("^[\\\\/]+", "");
        Path file = rootLocation.resolve(cleanFilename).normalize();
        if (!file.startsWith(rootLocation)) {
            throw new IllegalArgumentException("Invalid file path.");
        }
        return file;
    }

    private String buildBaseName(String originalFilename) {
        String stripped = originalFilename;
        int dotIndex = stripped.lastIndexOf('.');
        if (dotIndex > 0) {
            stripped = stripped.substring(0, dotIndex);
        }

        String slug = stripped
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-+|-+$", "");

        if (slug.isBlank()) {
            return "image";
        }

        return slug.length() > 36 ? slug.substring(0, 36) : slug;
    }

    private String getExtension(String filename, String contentType) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex >= 0) {
            String ext = filename.substring(dotIndex).toLowerCase(Locale.ROOT);
            if (Set.of(".jpg", ".jpeg", ".png", ".webp").contains(ext)) {
                return ext;
            }
        }

        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
