package com.safereturn.in.repository;

import com.safereturn.in.entity.FaceEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FaceEmbeddingRepository extends JpaRepository<FaceEmbedding, Long> {

    @Query("SELECT fe FROM FaceEmbedding fe WHERE fe.missingPersonReport.id = :reportId")
    Optional<FaceEmbedding> findByReportId(Long reportId);

    @Query("""
            SELECT fe FROM FaceEmbedding fe
            JOIN FETCH fe.missingPersonReport r
            WHERE LOWER(TRIM(r.status)) = 'published'
            """)
    List<FaceEmbedding> findAllActiveEmbeddings();

    @Modifying
    @Transactional
    @Query("DELETE FROM FaceEmbedding fe WHERE fe.missingPersonReport.id = :reportId")
    void deleteByReportId(Long reportId);
}
