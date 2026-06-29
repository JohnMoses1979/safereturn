package com.safereturn.in.service;

import com.safereturn.in.client.FaceApiClient;
import com.safereturn.in.dto.FaceMatchResponse;
import com.safereturn.in.dto.FaceMatchResult;
import com.safereturn.in.entity.FaceEmbedding;
import com.safereturn.in.exception.FaceApiException;
import com.safereturn.in.util.EmbeddingDistanceUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
public class AiFaceMatchService {

    private final FaceEmbeddingService faceEmbeddingService;
    private final FaceApiClient        faceApiClient;

    private static final String CACHE_NAME  = "activeEmbeddings";
    private static final int    MAX_RESULTS = 10;

    public AiFaceMatchService(FaceEmbeddingService faceEmbeddingService,
                              FaceApiClient faceApiClient) {
        this.faceEmbeddingService = faceEmbeddingService;
        this.faceApiClient        = faceApiClient;
    }

    public FaceMatchResponse search(MultipartFile queryImage) {
        log.info("Face match search — filename={} size={} bytes",
                queryImage.getOriginalFilename(), queryImage.getSize());

        List<Double> queryEmbedding;
        try {
            queryEmbedding = faceApiClient.getEmbedding(queryImage);
        } catch (IOException e) {
            throw new FaceApiException(
                    "Could not read the uploaded query image: " + e.getMessage(), 400);
        }

        long publishedReports = faceEmbeddingService.countPublishedReports();
        List<FaceEmbedding> candidates = loadActiveEmbeddings();
        log.info("Comparing against {} active candidate(s)", candidates.size());

        if (candidates.isEmpty() || candidates.size() < publishedReports) {
            log.info("Active embedding cache is stale or incomplete (candidates={}, publishedReports={}) â€” rebuilding",
                    candidates.size(), publishedReports);
            int rebuilt = faceEmbeddingService.rebuildActiveEmbeddings();
            if (rebuilt > 0) {
                candidates = loadActiveEmbeddings();
                log.info("Reloaded {} active candidate(s) after rebuild", candidates.size());
            }
        }

        if (candidates.isEmpty()) {
            return FaceMatchResponse.builder()
                    .matches(List.of())
                    .matchCount(0)
                    .totalSearched(0)
                    .threshold(EmbeddingDistanceUtil.DISTANCE_THRESHOLD)
                    .build();
        }

        List<FaceMatchResult> matches = candidates.stream()
                .map(fe -> {
                    double distance = EmbeddingDistanceUtil.euclideanDistance(
                            fe.getEmbedding(), queryEmbedding);
                    log.info("Candidate reportId={} name={} distance={} threshold={} match={}",
                            fe.getMissingPersonReport().getId(),
                            fe.getMissingPersonReport().getFullName(),
                            String.format(java.util.Locale.ROOT, "%.4f", distance),
                            EmbeddingDistanceUtil.DISTANCE_THRESHOLD,
                            EmbeddingDistanceUtil.isMatch(distance));
                    return FaceMatchResult.builder()
                            .reportId(fe.getMissingPersonReport().getId())
                            .fullName(fe.getMissingPersonReport().getFullName())
                            .photoUrl(fe.getMissingPersonReport().getPhotoUrl())
                            .distance(distance)
                            .confidence(Math.max(0.0,
                                    Math.round((1.0 - distance) * 10000.0) / 10000.0))
                            .build();
                })
                .filter(r  -> EmbeddingDistanceUtil.isMatch(r.getDistance()))
                .sorted(Comparator.comparingDouble(FaceMatchResult::getDistance))
                .limit(MAX_RESULTS)
                .toList();

        log.info("Search complete — {}/{} matched (threshold={})",
                matches.size(), candidates.size(),
                EmbeddingDistanceUtil.DISTANCE_THRESHOLD);

        return FaceMatchResponse.builder()
                .matches(matches)
                .matchCount(matches.size())
                .totalSearched(candidates.size())
                .threshold(EmbeddingDistanceUtil.DISTANCE_THRESHOLD)
                .build();
    }

    @Cacheable(value = CACHE_NAME, key = "'all'")
    public List<FaceEmbedding> loadActiveEmbeddings() {
        log.info("Cache miss — loading active embeddings from DB");
        return faceEmbeddingService.loadAllActive();
    }
}
