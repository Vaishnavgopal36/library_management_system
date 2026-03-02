package com.backend.backend.service;

import com.backend.backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ReservationCleanupJob {

    private final ReservationRepository reservationRepository;

    // FEATURE 4: Auto-Expire Background Job
    // Runs every 30 minutes (1,800,000 milliseconds)
    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void expireStaleReservations() {
        int expiredCount = reservationRepository.expireOldReservations();
        if (expiredCount > 0) {
            System.out.println("Automated Job: Cleaned up " + expiredCount + " expired reservations.");
        }
    }
}