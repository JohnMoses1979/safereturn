package com.safereturn.in.controller;

import com.safereturn.in.dto.FaceMatchResponse;
import com.safereturn.in.exception.FaceApiException;
import com.safereturn.in.service.AiFaceMatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/face-match")
@RequiredArgsConstructor
public class AiFaceMatchController {

    private final AiFaceMatchService aiFaceMatchService;

    @PostMapping(
            value    = "/search",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> search(@RequestPart("photo") MultipartFile photo) {
        log.info("POST /api/face-match/search — filename={} size={} bytes",
                photo.getOriginalFilename(), photo.getSize());

        if (photo.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error",
                            "No photo provided. Please upload an image containing a face."));
        }

        try {
            FaceMatchResponse response = aiFaceMatchService.search(photo);
            return ResponseEntity.ok(response);
        } catch (FaceApiException e) {
            log.warn("Face match failed: httpStatus={} message={}",
                    e.getHttpStatus(), e.getMessage());
            HttpStatus status = HttpStatus.resolve(e.getHttpStatus());
            if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
            return ResponseEntity.status(status)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}