package com.backend.backend.controller;

import com.backend.backend.entity.Notification;
import com.backend.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getAlerts(Authentication authentication) {
        // Strictly scoped to the authenticated user's JWT identity
        return ResponseEntity.ok(notificationService.getUserNotifications(authentication.getName()));
    }
}