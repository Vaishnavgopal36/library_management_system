package com.backend.backend.repository;

import com.backend.backend.entity.Transaction;
import com.backend.backend.entity.enums.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByUserId(UUID userId);
    long countByStatus(TransactionStatus status);
    long countByUserIdAndStatusIn(UUID userId, Collection<TransactionStatus> statuses);
    long countByBookIdAndStatusIn(UUID bookId, Collection<TransactionStatus> statuses);
    List<Transaction> findByStatusInAndDueDateBefore(Collection<TransactionStatus> statuses, LocalDateTime date);
    
    // Required for the Automation Engine to find overdue items
    List<Transaction> findByStatusAndDueDateBefore(TransactionStatus status, LocalDateTime date);
}
