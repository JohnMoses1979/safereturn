package com.safereturn.in.repository;

import com.safereturn.in.entity.SightingReport;
import com.safereturn.in.enums.SightingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SightingReportRepository extends JpaRepository<SightingReport, Long> {

    /** All sightings ordered by newest first */
    Page<SightingReport> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Sightings linked to a specific missing person report */
    List<SightingReport> findByMissingReportIdOrderByCreatedAtDesc(Long missingReportId);

    /** Sightings submitted by a specific user */
    List<SightingReport> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Sightings by status */
    List<SightingReport> findByStatus(SightingStatus status);

    /** Total count for dashboard stats */
    long count();
}