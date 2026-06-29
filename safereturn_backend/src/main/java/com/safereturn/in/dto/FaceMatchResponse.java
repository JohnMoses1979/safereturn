package com.safereturn.in.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FaceMatchResponse {
    private final List<FaceMatchResult> matches;
    private final int                   matchCount;
    private final int                   totalSearched;
    private final double                threshold;
}