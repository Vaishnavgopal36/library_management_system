package com.backend.backend.service;

import com.backend.backend.entity.Notification;
import com.backend.backend.entity.User;
import jakarta.persistence.criteria.Predicate;
import com.backend.backend.repository.NotificationRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(String email) {
        return getUserNotifications(email, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(
            String email,
            UUID notificationId,
            String type,
            Boolean isRead,
            String message,
            LocalDateTime createdAfter,
            LocalDateTime createdBefore
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Specification<Notification> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), user.getId()));

            if (notificationId != null) {
                predicates.add(cb.equal(root.get("id"), notificationId));
            }
            if (type != null && !type.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("type")), type.trim().toLowerCase()));
            }
            if (isRead != null) {
                predicates.add(cb.equal(root.get("isRead"), isRead));
            }
            if (message != null && !message.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("message")), "%" + message.trim().toLowerCase() + "%"));
            }
            if (createdAfter != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), createdAfter));
            }
            if (createdBefore != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), createdBefore));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return notificationRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Transactional
    public void notifyFineAccrued(User user, BigDecimal incrementalAmount, BigDecimal totalOutstanding) {
        if (user == null || incrementalAmount == null || totalOutstanding == null) {
            return;
        }

        String message = String.format(
                "Late fee increased by %s. Outstanding fines: %s.",
                incrementalAmount.toPlainString(),
                totalOutstanding.toPlainString()
        );
        createSystemNotification(user, "fine_accrual", message);
    }

    @Transactional
    public void notifyFineSettled(User user, BigDecimal settledAmount, BigDecimal totalOutstanding) {
        if (user == null || settledAmount == null || totalOutstanding == null) {
            return;
        }

        String message = String.format(
                "Fine payment of %s recorded. Outstanding fines: %s.",
                settledAmount.toPlainString(),
                totalOutstanding.toPlainString()
        );
        createSystemNotification(user, "fine_settlement", message);
    }

    private void createSystemNotification(User user, String type, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }
}
