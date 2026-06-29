package com.safereturn.in.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FaceMatchResult {
    private final Long   reportId;
    private final String fullName;
    private final String photoUrl;
    private final double distance;
    private final double confidence;
}