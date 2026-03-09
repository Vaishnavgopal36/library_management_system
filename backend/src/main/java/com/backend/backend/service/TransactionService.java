package com.backend.backend.service;

import com.backend.backend.dto.request.TransactionRequest;
import com.backend.backend.dto.response.TransactionResponse;
import com.backend.backend.entity.Book;
import com.backend.backend.entity.Fine;
import com.backend.backend.entity.Transaction;
import com.backend.backend.entity.User;
import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.repository.BookRepository;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.ReservationRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final int MAX_ACTIVE_BORROWS = 3;
    private static final int MAX_ACTIVE_ITEMS = 3;
    private static final BigDecimal DAILY_OVERDUE_FINE = BigDecimal.valueOf(2.00);
    private static final List<TransactionStatus> ACTIVE_BORROW_STATUSES =
            List.of(TransactionStatus.issued, TransactionStatus.overdue, TransactionStatus.lost);

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final FineRepository fineRepository;
    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<TransactionResponse> getGlobalHistory() {
        return getGlobalHistory(null, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getGlobalHistory(
            UUID transactionId,
            UUID userId,
            UUID bookId,
            String status,
            LocalDateTime checkoutAfter,
            LocalDateTime checkoutBefore,
            LocalDateTime dueAfter,
            LocalDateTime dueBefore
    ) {
        return searchHistory(
                transactionId,
                userId,
                bookId,
                parseStatus(status),
                checkoutAfter,
                checkoutBefore,
                dueAfter,
                dueBefore
        );
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getUserHistory(String email) {
        return getUserHistory(email, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getUserHistory(
            String email,
            UUID transactionId,
            UUID bookId,
            String status,
            LocalDateTime checkoutAfter,
            LocalDateTime checkoutBefore,
            LocalDateTime dueAfter,
            LocalDateTime dueBefore
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return searchHistory(
                transactionId,
                user.getId(),
                bookId,
                parseStatus(status),
                checkoutAfter,
                checkoutBefore,
                dueAfter,
                dueBefore
        );
    }

    private List<TransactionResponse> searchHistory(
            UUID transactionId,
            UUID userId,
            UUID bookId,
            TransactionStatus status,
            LocalDateTime checkoutAfter,
            LocalDateTime checkoutBefore,
            LocalDateTime dueAfter,
            LocalDateTime dueBefore
    ) {
        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (transactionId != null) {
                predicates.add(cb.equal(root.get("id"), transactionId));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (bookId != null) {
                predicates.add(cb.equal(root.get("book").get("id"), bookId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (checkoutAfter != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("checkoutDate"), checkoutAfter));
            }
            if (checkoutBefore != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("checkoutDate"), checkoutBefore));
            }
            if (dueAfter != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dueDate"), dueAfter));
            }
            if (dueBefore != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dueDate"), dueBefore));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return transactionRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "checkoutDate")).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "books", allEntries = true)
    @Transactional
    public TransactionResponse issueBook(TransactionRequest request) {
        return issueBook(request.getUserId(), request.getBookId());
    }

    @CacheEvict(value = "books", allEntries = true)
    @Transactional
    public TransactionResponse issueBook(UUID userId, UUID bookId) {
        if (userId == null || bookId == null) {
            throw new IllegalArgumentException("Both userId and bookId are required.");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Book book = bookRepository.findById(bookId)
            .orElseThrow(() -> new IllegalArgumentException("Book not found"));

        BigDecimal totalUnpaidFines = fineRepository.sumUnpaidAmountByUserId(user.getId());
        if (totalUnpaidFines != null && totalUnpaidFines.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException(
                    "Cannot issue book. User has unpaid fines totaling " + totalUnpaidFines + "."
            );
        }

        enforceBorrowLimits(user.getId());

        // Enforce ACID constraint: Check true dynamic stock before issuing — single batch query
        List<Object[]> stockRows = bookRepository.getTrueAvailableStockBatch(List.of(book.getId()));
        Integer availableStock = stockRows.isEmpty() ? null : ((Number) stockRows.get(0)[1]).intValue();
        if (availableStock == null || availableStock <= 0) {
            throw new IllegalStateException("Book is currently out of stock.");
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .book(book)
                .checkoutDate(LocalDateTime.now())
                .dueDate(LocalDateTime.now().plusDays(14)) // Standard 14-day loan
                .status(TransactionStatus.issued) 
                .build();

        Transaction savedTransaction = transactionRepository.save(transaction);
        // Notify the member that the book was issued to them
        notificationService.notifyBookIssued(user, book.getTitle(), savedTransaction.getDueDate());
        return mapToResponse(savedTransaction);
    }

    @CacheEvict(value = "books", allEntries = true)
    @Transactional
    public TransactionResponse returnBook(UUID transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (transaction.getStatus() == TransactionStatus.returned) {
            throw new IllegalStateException("Book is already returned.");
        }

        transaction.setStatus(TransactionStatus.returned);
        transaction.setReturnDate(LocalDateTime.now());

        if (transaction.getReturnDate().isAfter(transaction.getDueDate())) {
            long daysLate = ChronoUnit.DAYS.between(transaction.getDueDate(), transaction.getReturnDate());
            if (daysLate > 0) {
                BigDecimal expectedFineToDate = DAILY_OVERDUE_FINE.multiply(BigDecimal.valueOf(daysLate));
                BigDecimal alreadyCharged = fineRepository.sumAmountByTransactionId(transaction.getId());
                BigDecimal incrementalFine = expectedFineToDate.subtract(
                        alreadyCharged != null ? alreadyCharged : BigDecimal.ZERO
                );

                if (incrementalFine.compareTo(BigDecimal.ZERO) <= 0) {
                    return mapToResponse(transactionRepository.save(transaction));
                }

                Fine fine = Fine.builder()
                        .transaction(transaction)
                        .user(transaction.getUser())
                        .amount(incrementalFine)
                        .reason("Overdue return: " + daysLate + " days late")
                        .isPaid(false)
                        .build();
                fineRepository.save(fine);
                BigDecimal outstanding = fineRepository.sumUnpaidAmountByUserId(transaction.getUser().getId());
                notificationService.notifyFineAccrued(
                        transaction.getUser(),
                        incrementalFine,
                        outstanding != null ? outstanding : BigDecimal.ZERO
                );
            }
        }

        return mapToResponse(transactionRepository.save(transaction));
    }

    @CacheEvict(value = "books", allEntries = true)
    @Transactional
    public TransactionResponse markLost(UUID transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (transaction.getStatus() == TransactionStatus.lost) {
            throw new IllegalStateException("Book is already marked as lost.");
        }
        if (transaction.getStatus() == TransactionStatus.returned) {
            throw new IllegalStateException("Cannot mark a returned transaction as lost.");
        }

        transaction.setStatus(TransactionStatus.lost);
        return mapToResponse(transactionRepository.save(transaction));
    }

    /**
     * Computes the canonical overdue fine purely from dates: daysLate × DAILY_OVERDUE_FINE.
     * Reference point is returnDate for returned books, otherwise now.
     * This is the single source of truth — no DB fine record reads are needed for display.
     */
    private BigDecimal computeAccruedFine(Transaction transaction) {
        LocalDateTime referenceDate = transaction.getReturnDate() != null
                ? transaction.getReturnDate()
                : LocalDateTime.now();
        long daysLate = Math.max(0, ChronoUnit.DAYS.between(transaction.getDueDate(), referenceDate));
        return DAILY_OVERDUE_FINE.multiply(BigDecimal.valueOf(daysLate));
    }

    // Helper method to safely convert Database Entities into JSON Data Transfer Objects
    private TransactionResponse mapToResponse(Transaction transaction) {
        String userName = transaction.getUser().getFullName();
        if (userName == null || userName.isBlank()) {
            userName = transaction.getUser().getEmail();
        }

        return TransactionResponse.builder()
                .id(transaction.getId())
                .bookId(transaction.getBook().getId())
                .userId(transaction.getUser().getId())
                .bookName(transaction.getBook().getTitle())
                .userName(userName)
                .checkoutDate(transaction.getCheckoutDate())
                .dueDate(transaction.getDueDate())
                .returnDate(transaction.getReturnDate())
                .status(transaction.getStatus().name())
                .totalAccruedFine(computeAccruedFine(transaction))
                .build();
    }

    private void enforceBorrowLimits(UUID userId) {
        long activeBorrowed = transactionRepository.countByUserIdAndStatusIn(userId, ACTIVE_BORROW_STATUSES);
        if (activeBorrowed >= MAX_ACTIVE_BORROWS) {
            throw new IllegalStateException("Borrow limit reached. Max 3 active borrowed books.");
        }

        long activeReservations = reservationRepository.countActiveByUserId(userId, LocalDateTime.now());
        if (activeBorrowed + activeReservations >= MAX_ACTIVE_ITEMS) {
            throw new IllegalStateException("Total active items limit reached. Max 3 borrowed/reserved books.");
        }
    }

    private TransactionStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        try {
            return TransactionStatus.valueOf(status.trim().toLowerCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid transaction status filter. Allowed values: issued, returned, overdue, lost.");
        }
    }
}
