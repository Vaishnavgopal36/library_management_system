package com.backend.backend.service;

import com.backend.backend.entity.Transaction;
import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.repository.BookRepository;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final FineRepository fineRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> generateSystemAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        analytics.put("totalActiveBooks", bookRepository.countByIsArchivedFalse());
        analytics.put("totalActiveUsers", userRepository.countByIsActiveTrue());
        analytics.put("currentlyIssuedBooks", transactionRepository.countByStatusIn(
                List.of(TransactionStatus.issued, TransactionStatus.overdue)));
        // Canonical unpaid fines: sum(daysLate × 2) for every overdue transaction,
        // minus what has already been paid via settle — always consistent with the per-transaction display.
        analytics.put("totalUnpaidFinesValue", computeTotalUnpaidFines());
        analytics.put("totalFineRevenue", nonNullCurrency(fineRepository.sumAmountByIsPaidTrue()));
        analytics.put("topBorrowedBooks", getTopBorrowedBooks(5));

        return analytics;
    }

    private BigDecimal nonNullCurrency(BigDecimal amount) {
        return amount != null ? amount : BigDecimal.ZERO;
    }

    /**
     * Total unpaid fines = Σ max(0, daysLate×2 - alreadyPaid) for all overdue transactions.
     * Computed purely from dates — never stale, always consistent with what the user sees.
     */
    private BigDecimal computeTotalUnpaidFines() {
        List<Transaction> overdue = transactionRepository.findByStatus(TransactionStatus.overdue);
        return overdue.stream()
                .map(t -> {
                    long days = Math.max(0, ChronoUnit.DAYS.between(t.getDueDate(), LocalDateTime.now()));
                    BigDecimal accrued = BigDecimal.valueOf(days * 2L);
                    BigDecimal paid = nonNullCurrency(fineRepository.sumPaidAmountByTransactionId(t.getId()));
                    return accrued.subtract(paid).max(BigDecimal.ZERO);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<Map<String, Object>> getTopBorrowedBooks(int limit) {
        return transactionRepository.findTopBorrowedBooks(PageRequest.of(0, limit))
                .stream()
                .map(row -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("bookId", row[0]);
                    item.put("title", row[1]);
                    item.put("borrowCount", ((Number) row[2]).longValue());
                    return item;
                })
                .toList();
    }
}
