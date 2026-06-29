package com.safereturn.in.client;

import com.safereturn.in.exception.FaceApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class FaceApiClient {

    private final RestTemplate restTemplate;

    @Value("${face.api.url}")
    private String faceApiUrl;

    private static final String EMBED_PATH = "/embed";

    public FaceApiClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<Double> getEmbedding(MultipartFile file) throws IOException {
        log.info("POST {}{} — filename={} size={} bytes",
                faceApiUrl, EMBED_PATH, file.getOriginalFilename(), file.getSize());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource imageResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                String original = file.getOriginalFilename();
                return (original != null && !original.isBlank()) ? original : "photo.jpg";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", imageResource);

        return doPost(new HttpEntity<>(body, headers));
    }

    public List<Double> getEmbedding(byte[] photoBytes, String filename) throws IOException {
        log.info("POST {}{} — filename={} size={} bytes",
                faceApiUrl, EMBED_PATH, filename, photoBytes.length);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource imageResource = new ByteArrayResource(photoBytes) {
            @Override
            public String getFilename() {
                return (filename != null && !filename.isBlank()) ? filename : "photo.jpg";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", imageResource);

        return doPost(new HttpEntity<>(body, headers));
    }

    private List<Double> doPost(HttpEntity<MultiValueMap<String, Object>> request) {
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    faceApiUrl + EMBED_PATH, request, Map.class);
            return parseEmbedding(response.getBody());

        } catch (HttpClientErrorException e) {
            log.warn("Python /embed client error: status={} body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new FaceApiException(
                    "Face embedding failed: " + extractDetail(e.getResponseBodyAsString()),
                    e.getStatusCode().value());

        } catch (HttpServerErrorException e) {
            log.error("Python /embed server error: status={} body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new FaceApiException(
                    "Face embedding service encountered an internal error. Please try again.",
                    503);

        } catch (ResourceAccessException e) {
            log.error("Python /embed unreachable: {}", e.getMessage());
            throw new FaceApiException(
                    "Face embedding service is currently unavailable. Please try again later.",
                    503);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Double> parseEmbedding(Map<?, ?> body) {
        if (body == null || !body.containsKey("embedding")) {
            throw new FaceApiException(
                    "Python /embed returned unexpected response (no 'embedding' key).", 502);
        }
        Object raw = body.get("embedding");
        if (!(raw instanceof List<?> list) || list.size() != 128) {
            throw new FaceApiException(
                    "Python /embed returned invalid embedding (expected 128 floats, got "
                            + (raw instanceof List<?> l ? l.size() : "non-list") + ").", 502);
        }
        return ((List<Number>) list).stream()
                .map(Number::doubleValue)
                .toList();
    }

    private String extractDetail(String responseBody) {
        if (responseBody != null && responseBody.contains("\"detail\"")) {
            int start = responseBody.indexOf("\"detail\"") + 10;
            int end   = responseBody.lastIndexOf("\"");
            if (start < end) return responseBody.substring(start, end);
        }
        return responseBody != null ? responseBody : "unknown error";
    }
}