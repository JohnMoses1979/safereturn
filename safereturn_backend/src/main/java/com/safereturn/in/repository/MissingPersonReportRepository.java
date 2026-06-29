package com.safereturn.in.repository;

import com.safereturn.in.entity.MissingPersonReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissingPersonReportRepository extends JpaRepository<MissingPersonReport, Long> {

    /** All reports ordered by newest first (for public listing) */
    Page<MissingPersonReport> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Reports submitted by a specific user */
    List<MissingPersonReport> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** All reports with a given status, newest first */
    List<MissingPersonReport> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

    /** All published reports, newest first, with normalized status matching. */
    @Query("""
        SELECT r FROM MissingPersonReport r
        WHERE LOWER(TRIM(r.status)) = 'published'
        ORDER BY r.createdAt DESC
        """)
    List<MissingPersonReport> findAllPublishedOrderByCreatedAtDesc();

    /** Count all published reports using the same normalized status rule. */
    @Query("""
        SELECT COUNT(r) FROM MissingPersonReport r
        WHERE LOWER(TRIM(r.status)) = 'published'
        """)
    long countAllPublishedNormalized();

    /** Full-text search across name, city, state, address */
    @Query("""
        SELECT r FROM MissingPersonReport r
        WHERE (
            LOWER(r.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(r.city)  LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(r.state) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(r.address) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(r.age)   LIKE LOWER(CONCAT('%', :q, '%'))
        )
        ORDER BY r.createdAt DESC
        """)
    Page<MissingPersonReport> search(@Param("q") String query, Pageable pageable);

    /** Reports excluding a specific user (for Community Reports page) */
    Page<MissingPersonReport> findByUserIdNotOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Count all reports for dashboard stats */
    long count();

    /** Count found/safe reports */
    long countByStatusIgnoreCase(String status);
}
