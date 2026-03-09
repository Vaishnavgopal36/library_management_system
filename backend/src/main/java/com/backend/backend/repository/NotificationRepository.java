package com.backend.backend.repository;

import com.backend.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID>, JpaSpecificationExecutor<Notification> {
    
    // Custom query to fetch alerts specific to a user
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndIsReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    int markAllReadByUserId(@Param("userId") UUID userId);
}
