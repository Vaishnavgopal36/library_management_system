package com.backend.backend.service;

import com.backend.backend.dto.response.AuthorResponse;
import com.backend.backend.dto.response.BookResponse;
import com.backend.backend.dto.response.CategoryResponse;
import com.backend.backend.dto.response.PublisherResponse;
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
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private static final int MAX_ACTIVE_BORROWS = 3;
    private static final int MAX_ACTIVE_ITEMS = 3;
    private static final List<TransactionStatus> ACTIVE_BORROW_STATUSES =  List.of(TransactionStatus.issued, TransactionStatus.overdue, TransactionStatus.lost);

    private final ReservationRepository reservationRepository;
    private final TransactionRepository transactionRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReservationResponse createReservation(UUID userId, UUID bookId) {
        
        // 1. Check Dynamic Stock — single batch query, no N+1
        List<Object[]> stockRows = bookRepository.getTrueAvailableStockBatch(List.of(bookId));
        Integer availableStock = stockRows.isEmpty() ? null : ((Number) stockRows.get(0)[1]).intValue();
        if (availableStock == null || availableStock <= 0) {
            throw new IllegalStateException("Sorry, all copies of this book are currently borrowed. Please check back later.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that member account."));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that book. It may have been removed."));

        enforceReservationLimits(user.getId());

        Reservation reservation = Reservation.builder()
                .user(user)
                .book(book)
                .status("active")
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        try {
            // availableStock is already resolved above; reuse it to avoid a second query.
            return mapToResponse(reservationRepository.saveAndFlush(reservation), availableStock);
        } catch (DataIntegrityViolationException | JpaSystemException e) {
            // Catches both constraint violations and DB trigger exceptions (PSQLException wrapped as JpaSystemException)
            String msg = e.getMostSpecificCause().getMessage();
            if (msg != null && msg.contains("Limit reached")) {
                throw new IllegalStateException("You've reached the maximum number of active reservations. Please cancel an existing one before adding a new reservation.");
            }
            throw new IllegalArgumentException("This book is already reserved by you, or you've reached your reservation limit.");
        }
    }

    @Transactional
    public void fulfillReservation(UUID reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that reservation."));

        if (!"active".equals(reservation.getStatus())) {
            throw new IllegalStateException("This reservation has already been completed or cancelled and cannot be fulfilled.");
        }

        long activeBorrowed = transactionRepository.countByUserIdAndStatusIn(
                reservation.getUser().getId(),
                ACTIVE_BORROW_STATUSES
        );
        if (activeBorrowed >= MAX_ACTIVE_BORROWS) {
            throw new IllegalStateException("This member has already borrowed the maximum of 3 books. A book must be returned before this reservation can be fulfilled.");
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
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that member account."))
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
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that reservation."));

        if (!"active".equalsIgnoreCase(reservation.getStatus())) {
            throw new IllegalStateException("This reservation can't be cancelled because it is no longer active.");
        }

        reservation.setStatus("cancelled");
        reservationRepository.save(reservation);
    }

    private void enforceReservationLimits(UUID userId) {
        long activeReservations = reservationRepository.countActiveByUserId(userId, LocalDateTime.now());
        long activeBorrowed = transactionRepository.countByUserIdAndStatusIn(userId, ACTIVE_BORROW_STATUSES);
        if (activeBorrowed + activeReservations >= MAX_ACTIVE_ITEMS) {
            throw new IllegalStateException("You have reached the maximum limit of 3 books. Please return a book before reserving another.");
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

        List<Reservation> reservations = reservationRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "reservedAt"));
        // Batch-fetch stock for all books on this result set — not one query per reservation.
        List<UUID> bookIds = reservations.stream().map(r -> r.getBook().getId()).collect(Collectors.toList());
        Map<UUID, Integer> stockMap = fetchStockMap(bookIds);
        return reservations.stream()
                .map(r -> mapToResponse(r, stockMap.getOrDefault(r.getBook().getId(), 0)))
                .collect(Collectors.toList());
    }

    /**
     * Fetches true available stock for a collection of book IDs in a SINGLE SQL query.
     * Safe for empty input: returns an empty map without hitting the database.
     */
    private Map<UUID, Integer> fetchStockMap(Collection<UUID> bookIds) {
        if (bookIds == null || bookIds.isEmpty()) return Collections.emptyMap();
        List<Object[]> rows = bookRepository.getTrueAvailableStockBatch(bookIds);
        Map<UUID, Integer> map = new HashMap<>(rows.size());
        for (Object[] row : rows) {
            UUID id    = UUID.fromString(row[0].toString());
            int  stock = row[1] == null ? 0 : ((Number) row[1]).intValue();
            map.put(id, stock);
        }
        return map;
    }

    private ReservationResponse mapToResponse(Reservation reservation, int trueStock) {
        User user = reservation.getUser();
        Book book = reservation.getBook();

        List<AuthorResponse> authors = book.getAuthors() == null
                ? Collections.emptyList()
                : book.getAuthors().stream()
                        .map(a -> AuthorResponse.builder().id(a.getId()).name(a.getName()).build())
                        .sorted(Comparator.comparing(AuthorResponse::getName, String.CASE_INSENSITIVE_ORDER))
                        .collect(Collectors.toList());

        List<CategoryResponse> categories = book.getCategories() == null
                ? Collections.emptyList()
                : book.getCategories().stream()
                        .map(c -> CategoryResponse.builder().id(c.getId()).name(c.getName()).build())
                        .sorted(Comparator.comparing(CategoryResponse::getName, String.CASE_INSENSITIVE_ORDER))
                        .collect(Collectors.toList());

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
                        .trueAvailableStock(trueStock)
                        .isArchived(book.getIsArchived())
                        .publisher(book.getPublisher() == null ? null : PublisherResponse.builder()
                                .id(book.getPublisher().getId())
                                .name(book.getPublisher().getName())
                                .build())
                        .authors(authors)
                        .categories(categories)
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
