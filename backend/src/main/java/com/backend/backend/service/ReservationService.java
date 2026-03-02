package com.backend.backend.service;

import com.backend.backend.dto.response.BookResponse;
import com.backend.backend.dto.response.ReservationResponse;
import com.backend.backend.dto.response.UserResponse;
import com.backend.backend.entity.Book;
import com.backend.backend.entity.Reservation;
import com.backend.backend.entity.Transaction;
import com.backend.backend.entity.User;
import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.repository.BookRepository;
import com.backend.backend.repository.ReservationRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private static final int MAX_ACTIVE_BORROWS = 3;
    private static final int MAX_ACTIVE_RESERVATIONS = 3;
    private static final int MAX_ACTIVE_ITEMS = 3;
    private static final List<TransactionStatus> ACTIVE_BORROW_STATUSES =
            List.of(TransactionStatus.issued, TransactionStatus.overdue, TransactionStatus.lost);

    private final ReservationRepository reservationRepository;
    private final TransactionRepository transactionRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReservationResponse createReservation(UUID userId, UUID bookId) {
        
        // 1. Check Dynamic Stock
        Integer availableStock = bookRepository.getTrueAvailableStock(bookId);
        if (availableStock == null || availableStock <= 0) {
            throw new IllegalStateException("Book is currently out of stock.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("Book not found"));

        enforceReservationLimits(user.getId());

        Reservation reservation = Reservation.builder()
                .user(user)
                .book(book)
                .status("active")
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        try {
            // saveAndFlush forces the INSERT immediately so we can catch DB constraint errors
            return mapToResponse(reservationRepository.saveAndFlush(reservation));
        } catch (DataIntegrityViolationException e) {
            // Catch PostgreSQL unique index limits
            throw new IllegalArgumentException("Reservation failed: Limit reached or duplicate hold.");
        }
    }

    @Transactional
    public void fulfillReservation(UUID reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        if (!"active".equals(reservation.getStatus())) {
            throw new IllegalStateException("Only active reservations can be fulfilled.");
        }

        long activeBorrowed = transactionRepository.countByUserIdAndStatusIn(
                reservation.getUser().getId(),
                ACTIVE_BORROW_STATUSES
        );
        if (activeBorrowed >= MAX_ACTIVE_BORROWS) {
            throw new IllegalStateException("Borrow limit reached. Max 3 active borrowed books.");
        }

        // Step 1: Update reservation status (Aligned with OpenAPI spec)
        // DB constraint uses "completed" (not "fulfilled").
        reservation.setStatus("completed");
        reservationRepository.save(reservation);
        
        // Step 2: Create corresponding transaction
        Transaction transaction = Transaction.builder()
                .user(reservation.getUser())
                .book(reservation.getBook())
                .status(TransactionStatus.issued)
                .dueDate(LocalDateTime.now().plusDays(14)) // Standard 2-week checkout
                .build();
        
        transactionRepository.save(transaction);
        // Both saves execute as a single atomic unit.
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllActiveHolds() {
        return reservationRepository.findByStatus("active").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getUserHolds(String email) {
        UUID userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
        return reservationRepository.findByUserIdAndStatus(userId, "active").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelReservation(UUID id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        if (!"active".equalsIgnoreCase(reservation.getStatus())) {
            throw new IllegalStateException("Only active reservations can be cancelled.");
        }

        // Soft delete: Shift state rather than deleting the row
        reservation.setStatus("cancelled");
        reservationRepository.save(reservation);
    }

    private void enforceReservationLimits(UUID userId) {
        long activeReservations = reservationRepository.countByUserIdAndStatus(userId, "active");
        if (activeReservations >= MAX_ACTIVE_RESERVATIONS) {
            throw new IllegalStateException("Reservation limit reached. Max 3 active reservations.");
        }

        long activeBorrowed = transactionRepository.countByUserIdAndStatusIn(userId, ACTIVE_BORROW_STATUSES);
        if (activeBorrowed + activeReservations >= MAX_ACTIVE_ITEMS) {
            throw new IllegalStateException("Total active items limit reached. Max 3 borrowed/reserved books.");
        }
    }

    private ReservationResponse mapToResponse(Reservation reservation) {
        User user = reservation.getUser();
        Book book = reservation.getBook();
        Integer dynamicStock = bookRepository.getTrueAvailableStock(book.getId());

        return ReservationResponse.builder()
                .id(reservation.getId())
                .user(UserResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole() != null ? user.getRole().name() : null)
                        .isActive(user.getIsActive())
                        .build())
                .book(BookResponse.builder()
                        .id(book.getId())
                        .title(book.getTitle())
                        .isbn(book.getIsbn())
                        .stockQuantity(book.getStockQuantity())
                        .trueAvailableStock(dynamicStock != null ? dynamicStock : 0)
                        .isArchived(book.getIsArchived())
                        .build())
                .reservedAt(reservation.getReservedAt())
                .expiresAt(reservation.getExpiresAt())
                .status(reservation.getStatus())
                .build();
    }
}
