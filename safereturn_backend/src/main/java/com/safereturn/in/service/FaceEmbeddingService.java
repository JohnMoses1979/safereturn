// package com.safereturn.in.service;

// import com.safereturn.in.client.FaceApiClient;
// import com.safereturn.in.entity.FaceEmbedding;
// import com.safereturn.in.entity.MissingPersonReport;
// import com.safereturn.in.exception.FaceApiException;
// import com.safereturn.in.repository.FaceEmbeddingRepository;
// import com.safereturn.in.util.EmbeddingDistanceUtil;
// import lombok.extern.slf4j.Slf4j;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.cache.CacheManager;
// import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

// import java.io.IOException;
// import java.nio.file.Files;
// import java.nio.file.Path;
// import java.nio.file.Paths;
// import java.util.List;
// import java.util.Optional;

// @ Slf4j 

//     @Service
//     public class FaceEmbeddingService {

//         private final FaceEmbeddingRepository embeddingRepository;
//         private final FaceApiClient faceApiClient;
//         private final CacheManager cacheManager;

//         @Value("${safereturn.upload-dir:uploads}")
//         private String uploadDir;

//         private static final String CACHE_NAME = "activeEmbeddings";
//         private static final String CACHE_KEY = "all";

//         public FaceEmbeddingService(FaceEmbeddingRepository embeddingRepository,
//                 FaceApiClient faceApiClient,
//                 CacheManager cacheManager) {
//             this.embeddingRepository = embeddingRepository;
//             this.faceApiClient = faceApiClient;
//             this.cacheManager = cacheManager;
//         }

//         @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
//         public void saveEmbedding(MissingPersonReport report) {
//             log.info("Generating embedding — reportId={} photoUrl={}",
//                     report.getId(), report.getPhotoUrl());

//             String subpath = extractSubpath(report.getPhotoUrl());

//             Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(subpath);
//             if (!Files.exists(filePath)) {
//                 throw new FaceApiException(
//                         "Photo file not found on disk for reportId=" + report.getId()
//                         + " — path: " + filePath, 404);
//             }

//             byte[] photoBytes;
//             try {
//                 photoBytes = Files.readAllBytes(filePath);
//             } catch (IOException e) {
//                 throw new FaceApiException(
//                         "Could not read photo for reportId=" + report.getId()
//                         + ": " + e.getMessage(), 500);
//             }

//             List<Double> embedding;
//             try {
//                 embedding = faceApiClient.getEmbedding(photoBytes, subpath);
//             } catch (IOException e) {
//                 throw new FaceApiException(
//                         "IO error calling embedding service for reportId="
//                         + report.getId() + ": " + e.getMessage(), 500);
//             }

//             String csv = EmbeddingDistanceUtil.toCsv(embedding);

//             Optional<FaceEmbedding> existing
//                     = embeddingRepository.findByReportId(report.getId());

//             if (existing.isPresent()) {
//                 existing.get().setEmbedding(csv);
//                 embeddingRepository.save(existing.get());
//                 log.info("Updated embedding for reportId={}", report.getId());
//             } else {
//                 embeddingRepository.save(FaceEmbedding.builder()
//                         .missingPersonReport(report)
//                         .embedding(csv)
//                         .build());
//                 log.info("Inserted new embedding for reportId={}", report.getId());
//             }

//             evictCache();
//         }
    

//     @Transactional
//     public void deleteEmbedding(Long reportId) {
//         embeddingRepository.findByReportId(reportId).ifPresentOrElse(
//                 fe -> {
//                     embeddingRepository.deleteByReportId(reportId);
//                     log.info("Deleted embedding for reportId={}", reportId);
//                     evictCache();
//                 },
//                 () -> log.debug("No embedding for reportId={} — nothing to delete", reportId)
//         );
//     }

//     @Transactional(readOnly = true)
//     public List<FaceEmbedding> loadAllActive() {
//         List<FaceEmbedding> results = embeddingRepository.findAllActiveEmbeddings();
//         log.info("Loaded {} active embedding(s)", results.size());
//         return results;
//     }

//     private void evictCache() {
//         var cache = cacheManager.getCache(CACHE_NAME);
//         if (cache != null) {
//             cache.evict(CACHE_KEY);
//             log.debug("Evicted cache='{}' key='{}'", CACHE_NAME, CACHE_KEY);
//         } else {
//             log.warn("Cache '{}' not found — eviction skipped. Check CacheConfig.", CACHE_NAME);
//         }
//     }

//     // Extracts the subpath after /api/images/ preserving date subfolders
// // e.g. /api/images/2026/06/05/abc.jpeg → 2026/06/05/abc.jpeg
//     private String extractSubpath(String photoUrl) {
//         if (photoUrl == null || photoUrl.isBlank()) {
//             throw new FaceApiException("Report has no photoUrl set.", 400);
//         }
//         final String PREFIX = "/api/images/";
//         int idx = photoUrl.indexOf(PREFIX);
//         if (idx == -1) {
//             // fallback: try last segment only
//             int lastSlash = photoUrl.lastIndexOf('/');
//             if (lastSlash == -1 || lastSlash == photoUrl.length() - 1) {
//                 throw new FaceApiException(
//                         "Cannot extract subpath from photoUrl: " + photoUrl, 400);
//             }
//             return photoUrl.substring(lastSlash + 1);
//         }
//         return photoUrl.substring(idx + PREFIX.length());
//     }
// }








package com.safereturn.in.service;

import com.safereturn.in.client.FaceApiClient;
import com.safereturn.in.entity.FaceEmbedding;
import com.safereturn.in.entity.MissingPersonReport;
import com.safereturn.in.exception.FaceApiException;
import com.safereturn.in.repository.MissingPersonReportRepository;
import com.safereturn.in.repository.FaceEmbeddingRepository;
import com.safereturn.in.util.EmbeddingDistanceUtil;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.net.URL;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class FaceEmbeddingService {

    private final FaceEmbeddingRepository embeddingRepository;
    private final FaceApiClient faceApiClient;
    private final MissingPersonReportRepository reportRepository;
    private final CacheManager cacheManager;

    @Value("${safereturn.upload-dir:uploads}")
    private String uploadDir;

    // Mirrors ImageStorageService.init() so both services resolve to the same root
    private Path rootLocation;

    private static final String CACHE_NAME = "activeEmbeddings";
    private static final String CACHE_KEY = "all";
    private static final String IMAGE_URL_PREFIX = "/api/images/";

    public FaceEmbeddingService(FaceEmbeddingRepository embeddingRepository,
            FaceApiClient faceApiClient,
            MissingPersonReportRepository reportRepository,
            CacheManager cacheManager) {
        this.embeddingRepository = embeddingRepository;
        this.faceApiClient = faceApiClient;
        this.reportRepository = reportRepository;
        this.cacheManager = cacheManager;
    }

    @PostConstruct
    public void init() {
        // Must match ImageStorageService.init() exactly: toAbsolutePath().normalize()
        rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        log.info("FaceEmbeddingService resolved rootLocation: {}", rootLocation);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void saveEmbedding(MissingPersonReport report) {
        upsertEmbedding(report);
        evictCache();
    }

    /**
     * Rebuilds embeddings for all currently published reports.
     * Used as a safe recovery path when the embedding table is empty or stale.
     */
    public int rebuildActiveEmbeddings() {
        List<MissingPersonReport> reports =
                reportRepository.findAllPublishedOrderByCreatedAtDesc();

        int rebuilt = 0;
        for (MissingPersonReport report : reports) {
            if (report == null || report.getPhotoUrl() == null || report.getPhotoUrl().isBlank()) {
                continue;
            }
            try {
                upsertEmbedding(report);
                rebuilt++;
            } catch (Exception e) {
                log.warn("Skipped rebuilding embedding for reportId={}: {}",
                        report.getId(), e.getMessage());
            }
        }

        if (rebuilt > 0) {
            evictCache();
        }
        log.info("Rebuilt {} active embedding(s) from published reports", rebuilt);
        return rebuilt;
    }

    private void upsertEmbedding(MissingPersonReport report) {
        log.info("Generating embedding — reportId={} photoUrl={}",
                report.getId(), report.getPhotoUrl());

        String subpath = extractSubpath(report.getPhotoUrl());

        // Resolve against the same normalized absolute rootLocation as ImageStorageService
        Path filePath = rootLocation.resolve(subpath).normalize();

        // Path traversal guard — mirrors ImageStorageService.load()
        if (!filePath.startsWith(rootLocation)) {
            throw new FaceApiException(
                    "Resolved path escapes upload root for reportId=" + report.getId(), 400);
        }

        byte[] photoBytes = readPhotoBytes(report.getId(), report.getPhotoUrl(), filePath);

        List<Double> embedding;
        try {
            embedding = faceApiClient.getEmbedding(photoBytes, subpath);
        } catch (IOException e) {
            throw new FaceApiException(
                    "IO error calling embedding service for reportId="
                    + report.getId() + ": " + e.getMessage(), 500);
        }

        String csv = EmbeddingDistanceUtil.toCsv(embedding);

        Optional<FaceEmbedding> existing = embeddingRepository.findByReportId(report.getId());

        if (existing.isPresent()) {
            existing.get().setEmbedding(csv);
            embeddingRepository.save(existing.get());
            log.info("Updated embedding for reportId={}", report.getId());
        } else {
            embeddingRepository.save(FaceEmbedding.builder()
                    .missingPersonReport(report)
                    .embedding(csv)
                    .build());
            log.info("Inserted new embedding for reportId={}", report.getId());
        }
    }

    private byte[] readPhotoBytes(Long reportId, String photoUrl, Path filePath) {
        if (Files.exists(filePath)) {
            try {
                return Files.readAllBytes(filePath);
            } catch (IOException e) {
                throw new FaceApiException(
                        "Could not read photo for reportId=" + reportId
                        + ": " + e.getMessage(), 500);
            }
        }

        if (photoUrl != null && (photoUrl.startsWith("http://") || photoUrl.startsWith("https://"))) {
            try (InputStream in = new URL(photoUrl).openStream()) {
                byte[] bytes = in.readAllBytes();
                if (bytes.length == 0) {
                    throw new FaceApiException(
                            "Downloaded empty photo for reportId=" + reportId
                            + " from " + photoUrl, 404);
                }
                log.warn("Photo not found on disk for reportId={} — fell back to URL fetch: {}",
                        reportId, photoUrl);
                return bytes;
            } catch (IOException e) {
                throw new FaceApiException(
                        "Photo file not found on disk for reportId=" + reportId
                        + " and URL fetch failed: " + e.getMessage(), 404);
            }
        }

        throw new FaceApiException(
                "Photo file not found on disk for reportId=" + reportId
                + " — expected path: " + filePath, 404);
    }

    @Transactional
    public void deleteEmbedding(Long reportId) {
        embeddingRepository.findByReportId(reportId).ifPresentOrElse(
                fe -> {
                    embeddingRepository.deleteByReportId(reportId);
                    log.info("Deleted embedding for reportId={}", reportId);
                    evictCache();
                },
                () -> log.debug("No embedding for reportId={} — nothing to delete", reportId)
        );
    }

    @Transactional(readOnly = true)
    public List<FaceEmbedding> loadAllActive() {
        List<FaceEmbedding> results = embeddingRepository.findAllActiveEmbeddings();
        log.info("Loaded {} active embedding(s)", results.size());
        return results;
    }

    @Transactional(readOnly = true)
    public long countPublishedReports() {
        return reportRepository.countAllPublishedNormalized();
    }

    private void evictCache() {
        var cache = cacheManager.getCache(CACHE_NAME);
        if (cache != null) {
            cache.evict(CACHE_KEY);
            log.debug("Evicted cache='{}' key='{}'", CACHE_NAME, CACHE_KEY);
        } else {
            log.warn("Cache '{}' not found — eviction skipped. Check CacheConfig.", CACHE_NAME);
        }
    }

    /**
     * Extracts the relative subpath from a photoUrl produced by ImageStorageService.
     *
     * ImageStorageService.store() always sets:
     *   publicUrl = "/api/images/" + relativePath   (e.g. "2026/06/05/abc-123.jpg")
     *
     * So the only valid format is /api/images/{dateFolder}/{filename}.
     * No fallback — a missing prefix means the URL was not produced by this system.
     */
    private String extractSubpath(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            throw new FaceApiException("Report has no photoUrl set.", 400);
        }
        int idx = photoUrl.indexOf(IMAGE_URL_PREFIX);
        if (idx == -1) {
            throw new FaceApiException(
                    "photoUrl does not contain expected prefix '" + IMAGE_URL_PREFIX
                    + "' — got: " + photoUrl
                    + ". Was this URL produced by ImageStorageService?", 400);
        }
        String subpath = photoUrl.substring(idx + IMAGE_URL_PREFIX.length());
        if (subpath.isBlank()) {
            throw new FaceApiException(
                    "photoUrl has empty subpath after prefix: " + photoUrl, 400);
        }
        return subpath;
    }
}
