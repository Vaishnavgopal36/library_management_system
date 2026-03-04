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
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private static final int MAX_ACTIVE_BORROWS = 3;
    private static final int MAX_ACTIVE_RESERVATIONS = 3;
    private static final int MAX_ACTIVE_ITEMS = 3;
    private static final List<TransactionStatus> ACTIVE_BORROW_STATUSES =  List.of(TransactionStatus.issued, TransactionStatus.overdue, TransactionStatus.lost);

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
           
            return mapToResponse(reservationRepository.saveAndFlush(reservation));
        } catch (DataIntegrityViolationException e) {
   
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

        reservation.setStatus("completed");
        reservationRepository.save(reservation);
        
        Transaction transaction = Transaction.builder()
                .user(reservation.getUser())
                .book(reservation.getBook())
                .status(TransactionStatus.issued)
                .dueDate(LocalDateTime.now().plusDays(14)) 
                .build();
        
        transactionRepository.save(transaction);
     
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllActiveHolds() {
        return getAllHolds(null, null, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getUserHolds(String email) {
        return getUserHolds(email, null, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllHolds(
            UUID reservationId,
            UUID userId,
            UUID bookId,
            String status,
            LocalDateTime reservedAfter,
            LocalDateTime reservedBefore,
            LocalDateTime expiresAfter,
            LocalDateTime expiresBefore,
            Boolean includeExpired
    ) {
        return searchReservations(
                reservationId,
                userId,
                bookId,
                status,
                reservedAfter,
                reservedBefore,
                expiresAfter,
                expiresBefore,
                includeExpired
        );
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getUserHolds(
            String email,
            UUID reservationId,
            UUID bookId,
            String status,
            LocalDateTime reservedAfter,
            LocalDateTime reservedBefore,
            LocalDateTime expiresAfter,
            LocalDateTime expiresBefore,
            Boolean includeExpired
    ) {
        UUID userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();

        return searchReservations(
                reservationId,
                userId,
                bookId,
                status,
                reservedAfter,
                reservedBefore,
                expiresAfter,
                expiresBefore,
                includeExpired
        );
    }

    @Transactional
    public void cancelReservation(UUID id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        if (!"active".equalsIgnoreCase(reservation.getStatus())) {
            throw new IllegalStateException("Only active reservations can be cancelled.");
        }

        reservation.setStatus("cancelled");
        reservationRepository.save(reservation);
    }

    private void enforceReservationLimits(UUID userId) {
        long activeReservations = reservationRepository.countActiveByUserId(userId, LocalDateTime.now());
        if (activeReservations >= MAX_ACTIVE_RESERVATIONS) {
            throw new IllegalStateException("Reservation limit reached. Max 3 active reservations.");
        }

        long activeBorrowed = transactionRepository.countByUserIdAndStatusIn(userId, ACTIVE_BORROW_STATUSES);
        if (activeBorrowed + activeReservations >= MAX_ACTIVE_ITEMS) {
            throw new IllegalStateException("Total active items limit reached. Max 3 borrowed/reserved books.");
        }
    }

    private List<ReservationResponse> searchReservations(
            UUID reservationId,
            UUID userId,
            UUID bookId,
            String status,
            LocalDateTime reservedAfter,
            LocalDateTime reservedBefore,
            LocalDateTime expiresAfter,
            LocalDateTime expiresBefore,
            Boolean includeExpired
    ) {
        String normalizedStatus = normalizeStatus(status);
        LocalDateTime now = LocalDateTime.now();

        Specification<Reservation> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (reservationId != null) {
                predicates.add(cb.equal(root.get("id"), reservationId));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (bookId != null) {
                predicates.add(cb.equal(root.get("book").get("id"), bookId));
            }

            predicates.add(cb.equal(cb.lower(root.get("status")), normalizedStatus));

            if ("active".equals(normalizedStatus) && !Boolean.TRUE.equals(includeExpired)) {
                predicates.add(cb.or(
                        cb.isNull(root.get("expiresAt")),
                        cb.greaterThan(root.get("expiresAt"), now)
                ));
            }

            if (reservedAfter != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("reservedAt"), reservedAfter));
            }
            if (reservedBefore != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("reservedAt"), reservedBefore));
            }
            if (expiresAfter != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("expiresAt"), expiresAfter));
            }
            if (expiresBefore != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("expiresAt"), expiresBefore));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return reservationRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "reservedAt")).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "active";
        }

        String normalized = status.trim().toLowerCase(Locale.ROOT);
        if ("fulfilled".equals(normalized)) {
            return "completed";
        }

        if (!List.of("active", "completed", "cancelled", "expired").contains(normalized)) {
            throw new IllegalArgumentException(
                    "Invalid reservation status filter. Allowed values: active, completed, cancelled, expired."
            );
        }

        return normalized;
    }
}
