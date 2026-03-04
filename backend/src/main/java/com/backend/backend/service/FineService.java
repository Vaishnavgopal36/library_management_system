package com.backend.backend.service;

import com.backend.backend.dto.response.FineResponse;
import com.backend.backend.entity.Fine;
import jakarta.persistence.criteria.Predicate;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository fineRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

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
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();

        return searchLedger(fineId, userId, transactionId, isPaid, minAmount, maxAmount);
    }

    private List<FineResponse> searchLedger(
            UUID fineId,
            UUID userId,
            UUID transactionId,
            Boolean isPaid,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {
        Specification<Fine> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (fineId != null) {
                predicates.add(cb.equal(root.get("id"), fineId));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            if (transactionId != null) {
                predicates.add(cb.equal(root.get("transaction").get("id"), transactionId));
            }
            if (isPaid != null) {
                predicates.add(cb.equal(root.get("isPaid"), isPaid));
            }
            if (minAmount != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("amount"), maxAmount));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return fineRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FineResponse settleFine(UUID fineId) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new IllegalArgumentException("Fine record not found"));

        if (fine.getIsPaid()) {
            throw new IllegalStateException("Fine is already settled.");
        }

        fine.setIsPaid(true); // Soft Delete equivalent for financial obligations
        Fine updatedFine = fineRepository.save(fine);
        BigDecimal outstanding = fineRepository.sumUnpaidAmountByUserId(fine.getUser().getId());
        notificationService.notifyFineSettled(
                fine.getUser(),
                fine.getAmount(),
                outstanding != null ? outstanding : BigDecimal.ZERO
        );
        return mapToResponse(updatedFine);
    }

    private FineResponse mapToResponse(Fine fine) {
        String userName = fine.getUser().getFullName();
        if (userName == null || userName.isBlank()) {
            userName = fine.getUser().getEmail();
        }

        return FineResponse.builder()
                .id(fine.getId())
                .transactionId(fine.getTransaction().getId())
                .bookId(fine.getTransaction().getBook().getId())
                .userId(fine.getUser().getId())
                .bookName(fine.getTransaction().getBook().getTitle())
                .userName(userName)
                .amount(fine.getAmount())
                .isPaid(fine.getIsPaid())
                .build();
    }
}
