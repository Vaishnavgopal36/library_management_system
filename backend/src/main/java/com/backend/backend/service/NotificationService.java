package com.backend.backend.service;

import com.backend.backend.entity.Notification;
import com.backend.backend.entity.User;
import com.backend.backend.repository.NotificationRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }
}
