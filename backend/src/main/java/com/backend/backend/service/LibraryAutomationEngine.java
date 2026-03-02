package com.backend.backend.service;

import com.backend.backend.entity.Fine;
import com.backend.backend.entity.Transaction;
import com.backend.backend.entity.User;
import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.ReservationRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LibraryAutomationEngine {

    private static final BigDecimal DAILY_OVERDUE_FINE = BigDecimal.valueOf(2.00);
    private static final List<TransactionStatus> OVERDUE_TRACKING_STATUSES =
            List.of(TransactionStatus.issued, TransactionStatus.overdue);

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final FineRepository fineRepository;
    private final ReservationRepository reservationRepository;

    /**
     * FEATURE: Automated Fine Engine & Blacklist Automation
     * Executes daily at 00:01 AM server time.
     * Uses ACID transactions to ensure partial failures roll back cleanly.
     */
    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void processDailyOverdueLedger() {
        log.info("Starting midnight automated overdue processing...");
        
        // Fetch all non-returned transactions past due date.
        List<Transaction> overdueTransactions = transactionRepository
                .findByStatusInAndDueDateBefore(OVERDUE_TRACKING_STATUSES, LocalDateTime.now());

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        for (Transaction t : overdueTransactions) {
            long daysLate = ChronoUnit.DAYS.between(t.getDueDate(), LocalDateTime.now());
            if (t.getStatus() == TransactionStatus.issued) {
                t.setStatus(TransactionStatus.overdue);
                transactionRepository.save(t);
            }
            
            // Reconcile total fine amount to match accrued days; this avoids duplicate charging.
            if (daysLate > 0L) {
                BigDecimal expectedFineToDate = DAILY_OVERDUE_FINE.multiply(BigDecimal.valueOf(daysLate));
                BigDecimal alreadyCharged = fineRepository.sumAmountByTransactionId(t.getId());
                BigDecimal incrementalFine = expectedFineToDate.subtract(
                        alreadyCharged != null ? alreadyCharged : BigDecimal.ZERO
                );

                if (incrementalFine.compareTo(BigDecimal.ZERO) > 0) {
                    Fine dailyFine = Fine.builder()
                        .transaction(t)
                        .user(t.getUser())
                        .amount(incrementalFine)
                        .reason("Automated overdue accrual reconciliation.")
                        .isPaid(false)
                        .build();
                    fineRepository.save(dailyFine);
                }
            }

            // 2. Blacklist Automation Logic: > 30 Days triggers account deactivation
            if (t.getDueDate().isBefore(thirtyDaysAgo)) {
                User user = t.getUser();
                if (user.getIsActive()) {
                    user.setIsActive(false); // Soft Delete / Blacklist
                    userRepository.save(user);
                    log.warn("User {} blacklisted due to severely overdue item {}", user.getId(), t.getBook().getId());
                }
            }
        }
    }

    /**
     * FEATURE: Auto-Expire Holds
     * Executes every 30 minutes to free up inventory stock dynamically.
     */
    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void expireStaleReservations() {
        // Calls the custom @Modifying query already present in your ReservationRepository
        int expiredCount = reservationRepository.expireOldReservations();
        if (expiredCount > 0) {
            log.info("Automated Engine released {} expired reservations back into dynamic stock.", expiredCount);
        }
    }
}
