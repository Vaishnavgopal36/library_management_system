package com.backend.backend.service;

import com.backend.backend.dto.response.NotificationResponse;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(String email) {
        return getUserNotifications(email, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(
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

        return notificationRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::mapToResponse).collect(Collectors.toList());
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

    private static final int MAX_NOTIFICATIONS = 20;

    private void createSystemNotification(User user, String type, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        // Auto-trim: keep only the 20 most recent notifications per user
        List<Notification> all = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (all.size() > MAX_NOTIFICATIONS) {
            notificationRepository.deleteAll(all.subList(MAX_NOTIFICATIONS, all.size()));
        }
    }

    @Transactional
    public void notifyBookIssued(User user, String bookTitle, java.time.LocalDateTime dueDate) {
        if (user == null || bookTitle == null) return;
        String msg = String.format(
                "Book \"%s\" has been issued to you. Due date: %s.",
                bookTitle,
                dueDate != null ? dueDate.toLocalDate().toString() : "N/A"
        );
        createSystemNotification(user, "book_issued", msg);
    }

    @Transactional
    public void notifyFromAdmin(UUID targetUserId, String message) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        createSystemNotification(user, "admin_notice", message);
    }

    @Transactional
    public void markAsRead(UUID notificationId, String requesterEmail) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!n.getUser().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("Access denied.");
        }
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        notificationRepository.markAllReadByUserId(user.getId());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }
}
