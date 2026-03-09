package com.backend.backend.controller;

import com.backend.backend.dto.response.NotificationResponse;
import com.backend.backend.service.NotificationService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/v1/notification
     * Returns the user's notifications + unread count in one call.
     * Response: { notifications: [...], unreadCount: N }
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(Authentication authentication) {
        String email = authentication.getName();
        List<NotificationResponse> notifications = notificationService.getUserNotifications(email);
        long unreadCount = notificationService.getUnreadCount(email);
        return ResponseEntity.ok(Map.of("notifications", notifications, "unreadCount", unreadCount));
    }

    /**
     * POST /api/v1/notification
     * Admin sends a manual notification to a specific member.
     * Body: { userId, message }
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> sendAdminNotification(
            @RequestBody AdminNotifyRequest req
    ) {
        notificationService.notifyFromAdmin(req.getUserId(), req.getMessage());
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/v1/notification
     * Mark notifications as read.
     * Body with { id } → marks a single notification read.
     * Body without id (or empty {}) → marks ALL user notifications read.
     */
    @PutMapping
    public ResponseEntity<Void> markRead(
            @RequestBody(required = false) MarkReadRequest req,
            Authentication authentication
    ) {
        String email = authentication.getName();
        if (req != null && req.getId() != null) {
            notificationService.markAsRead(req.getId(), email);
        } else {
            notificationService.markAllAsRead(email);
        }
        return ResponseEntity.noContent().build();
    }

    @Data
    static class AdminNotifyRequest {
        private UUID userId;
        private String message;
    }

    @Data
    static class MarkReadRequest {
        private UUID id;
    }
}
