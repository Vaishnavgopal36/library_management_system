package com.backend.backend.repository;

import com.backend.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    // Custom query to fetch alerts specific to a user
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
