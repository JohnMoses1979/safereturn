package com.safereturn.in.repository;

import com.safereturn.in.entity.SavedReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedReportRepository extends JpaRepository<SavedReport, Long> {

    List<SavedReport> findByUserIdOrderBySavedAtDesc(Long userId);

    Optional<SavedReport> findByUserIdAndMissingReportId(Long userId, Long missingReportId);

    boolean existsByUserIdAndMissingReportId(Long userId, Long missingReportId);

    void deleteByUserIdAndMissingReportId(Long userId, Long missingReportId);
}