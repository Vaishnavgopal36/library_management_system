package com.backend.backend.repository;

import com.backend.backend.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID>, JpaSpecificationExecutor<Reservation> {
    
    // Used by Admin to see all active queue holds
    List<Reservation> findByStatus(String status);
    
    // Used by Member to see their personal active queue holds
    List<Reservation> findByUserIdAndStatus(UUID userId, String status);
    long countByUserIdAndStatus(UUID userId, String status);

    @Query("""
            SELECT r
            FROM Reservation r
            WHERE r.status = 'active'
              AND (r.expiresAt IS NULL OR r.expiresAt > :now)
            """)
    List<Reservation> findAllActive(@Param("now") LocalDateTime now);

    @Query("""
            SELECT r
            FROM Reservation r
            WHERE r.user.id = :userId
              AND r.status = 'active'
              AND (r.expiresAt IS NULL OR r.expiresAt > :now)
            """)
    List<Reservation> findActiveByUserId(
            @Param("userId") UUID userId,
            @Param("now") LocalDateTime now
    );

    @Query("""
            SELECT COUNT(r)
            FROM Reservation r
            WHERE r.user.id = :userId
              AND r.status = 'active'
              AND (r.expiresAt IS NULL OR r.expiresAt > :now)
            """)
    long countActiveByUserId(
            @Param("userId") UUID userId,
            @Param("now") LocalDateTime now
    );

    @Modifying
    @Query("UPDATE Reservation r SET r.status = 'expired' WHERE r.status = 'active' AND r.expiresAt < CURRENT_TIMESTAMP")
    int expireOldReservations();
}
