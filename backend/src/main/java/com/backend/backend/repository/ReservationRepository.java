package com.backend.backend.repository;

import com.backend.backend.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    
    // Used by Admin to see all active queue holds
    List<Reservation> findByStatus(String status);
    
    // Used by Member to see their personal active queue holds
    List<Reservation> findByUserIdAndStatus(UUID userId, String status);
    long countByUserIdAndStatus(UUID userId, String status);
@Modifying
    @Query("UPDATE Reservation r SET r.status = 'expired' WHERE r.status = 'active' AND r.expiresAt < CURRENT_TIMESTAMP")
    int expireOldReservations();
}
