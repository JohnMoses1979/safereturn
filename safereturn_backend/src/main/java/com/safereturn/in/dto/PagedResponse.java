package com.safereturn.in.dto;

import java.util.List;

/**
 * Generic paged response wrapper used by all list endpoints.
 */
public record PagedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean last
) {}