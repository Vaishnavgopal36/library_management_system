package com.backend.backend.service;

import com.backend.backend.dto.response.FineResponse;
import com.backend.backend.entity.Fine;
import com.backend.backend.entity.Transaction;
import com.backend.backend.entity.enums.TransactionStatus;
import jakarta.persistence.criteria.Predicate;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FineService {

    private static final BigDecimal DAILY_FINE = BigDecimal.valueOf(2);

    private final FineRepository fineRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /** Compute the canonical fine for a transaction: daysLate × 2, using returnDate or now. */
    private BigDecimal canonicalFine(Transaction tx) {
        LocalDateTime ref = tx.getReturnDate() != null ? tx.getReturnDate() : LocalDateTime.now();
        long days = Math.max(0, ChronoUnit.DAYS.between(tx.getDueDate(), ref));
        return DAILY_FINE.multiply(BigDecimal.valueOf(days));
    }

    @Transactional(readOnly = true)
    public List<FineResponse> getGlobalLedger() {
        return getGlobalLedger(null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<FineResponse> getGlobalLedger(
            UUID fineId,
            UUID userId,
            UUID transactionId,
            Boolean isPaid,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {
        return searchLedger(fineId, userId, transactionId, isPaid, minAmount, maxAmount);
    }

    @Transactional(readOnly = true)
    public List<FineResponse> getUserLedger(String email) {
        return getUserLedger(email, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<FineResponse> getUserLedger(
            String email,
            UUID fineId,
            UUID transactionId,
            Boolean isPaid,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {
        UUID userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that member account."))
                .getId();

        return searchLedger(fineId, userId, transactionId, isPaid, minAmount, maxAmount);
    }

    /**
     * Sources from the Transaction table (status=overdue) — NOT from Fine records.
     * This ensures every overdue transaction appears on the Fines page regardless of
     * whether the automation engine has created Fine records for it yet.
     *
     * amount   = canonical daysLate × 2 (always fresh from dates)
     * isPaid   = paidFineRecords >= canonical
     */
    private List<FineResponse> searchLedger(
            UUID fineId,
            UUID userId,
            UUID transactionId,
            Boolean isPaid,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {
        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), TransactionStatus.overdue));
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (transactionId != null) {
                predicates.add(cb.equal(root.get("id"), transactionId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<Transaction> txList = transactionRepository.findAll(spec,
                Sort.by(Sort.Direction.DESC, "dueDate"));

        return txList.stream()
                .map(this::txToFineResponse)
                .filter(fr -> isPaid == null || fr.getIsPaid().equals(isPaid))
                .filter(fr -> minAmount == null || fr.getAmount().compareTo(minAmount) >= 0)
                .filter(fr -> maxAmount == null || fr.getAmount().compareTo(maxAmount) <= 0)
                .sorted(Comparator.comparing(FineResponse::getIsPaid)) // unpaid (false) first; stable sort preserves dueDate DESC within each group
                .collect(Collectors.toList());
    }

    /** Build a FineResponse from a Transaction — canonical fine from dates, paid amount from fine records. */
    private FineResponse txToFineResponse(Transaction tx) {
        BigDecimal canonical = canonicalFine(tx);
        BigDecimal paid = fineRepository.sumPaidAmountByTransactionId(tx.getId());
        if (paid == null) paid = BigDecimal.ZERO;
        boolean settledd = canonical.compareTo(BigDecimal.ZERO) > 0 && paid.compareTo(canonical) >= 0;

        String userName = tx.getUser().getFullName();
        if (userName == null || userName.isBlank()) userName = tx.getUser().getEmail();

        return FineResponse.builder()
                .id(tx.getId())              // id == transactionId for settle endpoint
                .transactionId(tx.getId())
                .bookId(tx.getBook().getId())
                .userId(tx.getUser().getId())
                .bookName(tx.getBook().getTitle())
                .userName(userName)
                .amount(canonical)
                .isPaid(settledd)
                .build();
    }

    /**
     * Settles a fine by transactionId.
     * 1. Looks up the transaction directly (handles case where automation hasn't created Fine records yet).
     * 2. Marks all existing unpaid Fine records as paid.
     * 3. Creates a reconciliation record for any gap between Fine records and the canonical days×2 amount.
     * 4. Result: Fine records always sum exactly to days×2 after settlement.
     */
    @Transactional
    public FineResponse settleFine(UUID transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that borrowing record."));

        BigDecimal canonical = canonicalFine(tx);
        if (canonical.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalStateException("There is no outstanding fine for this borrowing record.");
        }

        BigDecimal alreadyPaid   = fineRepository.sumPaidAmountByTransactionId(transactionId);
        if (alreadyPaid == null) alreadyPaid = BigDecimal.ZERO;
        if (alreadyPaid.compareTo(canonical) >= 0) {
            throw new IllegalStateException("This fine has already been paid in full — no further action needed.");
        }

        // Mark all unpaid records as paid
        List<Fine> unpaid = fineRepository.findUnpaidByTransactionId(transactionId);
        BigDecimal settledFromRecords = BigDecimal.ZERO;
        for (Fine f : unpaid) {
            f.setIsPaid(true);
            settledFromRecords = settledFromRecords.add(f.getAmount());
            fineRepository.save(f);
        }

        // Reconcile: if existing records don't cover the full canonical amount, add gap record
        BigDecimal totalCoveredAfter = alreadyPaid.add(settledFromRecords);
        BigDecimal gap = canonical.subtract(totalCoveredAfter);
        if (gap.compareTo(BigDecimal.ZERO) > 0) {
            Fine reconcile = Fine.builder()
                    .transaction(tx)
                    .user(tx.getUser())
                    .amount(gap)
                    .reason("Settlement reconciliation")
                    .isPaid(true)
                    .build();
            fineRepository.save(reconcile);
        }

        BigDecimal outstanding = fineRepository.sumUnpaidAmountByUserId(tx.getUser().getId());
        notificationService.notifyFineSettled(
                tx.getUser(),
                canonical.subtract(alreadyPaid),
                outstanding != null ? outstanding : BigDecimal.ZERO
        );

        return txToFineResponse(tx);
    }
}
