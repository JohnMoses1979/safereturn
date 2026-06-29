package com.safereturn.in.repository;

import com.safereturn.in.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    /** Stamp last_login without loading the full entity. */
    @Modifying
    @Query("UPDATE User u SET u.lastLogin = :ts WHERE u.id = :id")
    void updateLastLogin(@Param("id") Long id, @Param("ts") LocalDateTime ts);

    // ─── Location-based queries for nearby-user alerts ─────────────────────

    List<User> findByArea(String area);

    List<User> findByLocality(String locality);

    List<User> findByPincode(String pincode);

    List<User> findByCity(String city);

    List<User> findByState(String state);
}