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

    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void processDailyOverdueLedger() {
        log.info("Starting midnight automated overdue processing...");
        
        List<Transaction> overdueTransactions = transactionRepository
                .findByStatusInAndDueDateBefore(OVERDUE_TRACKING_STATUSES, LocalDateTime.now());

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        for (Transaction t : overdueTransactions) {
            long daysLate = ChronoUnit.DAYS.between(t.getDueDate(), LocalDateTime.now());
            if (t.getStatus() == TransactionStatus.issued) {
                t.setStatus(TransactionStatus.overdue);
                transactionRepository.save(t);
            }
            
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

            if (t.getDueDate().isBefore(thirtyDaysAgo)) {
                User user = t.getUser();
                if (user.getIsActive()) {
                    user.setIsActive(false); 
                    userRepository.save(user);
                    log.warn("User {} blacklisted due to severely overdue item {}", user.getId(), t.getBook().getId());
                }
            }
        }
    }

    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void expireStaleReservations() {
        int expiredCount = reservationRepository.expireOldReservations();
        if (expiredCount > 0) {
            log.info("Automated Engine released {} expired reservations back into dynamic stock.", expiredCount);
        }
    }
}
