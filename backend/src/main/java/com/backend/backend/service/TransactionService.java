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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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

    @Transactional(readOnly = true)
    public List<TransactionResponse> getGlobalHistory() {
        return transactionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getUserHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
                
        return transactionRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TransactionResponse issueBook(TransactionRequest request) {
        return issueBook(request.getUserId(), request.getBookId());
    }

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

        // Enforce ACID constraint: Check true dynamic stock before issuing
        Integer availableStock = bookRepository.getTrueAvailableStock(book.getId());
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
        return mapToResponse(savedTransaction);
    }

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
            }
        }

        return mapToResponse(transactionRepository.save(transaction));
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
                .status(transaction.getStatus().name())
                .build();
    }

    private void enforceBorrowLimits(UUID userId) {
        long activeBorrowed = transactionRepository.countByUserIdAndStatusIn(userId, ACTIVE_BORROW_STATUSES);
        if (activeBorrowed >= MAX_ACTIVE_BORROWS) {
            throw new IllegalStateException("Borrow limit reached. Max 3 active borrowed books.");
        }

        long activeReservations = reservationRepository.countByUserIdAndStatus(userId, "active");
        if (activeBorrowed + activeReservations >= MAX_ACTIVE_ITEMS) {
            throw new IllegalStateException("Total active items limit reached. Max 3 borrowed/reserved books.");
        }
    }
}
