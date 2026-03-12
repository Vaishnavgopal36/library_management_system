package com.backend.backend.repository;

import com.backend.backend.entity.Transaction;
import com.backend.backend.entity.enums.TransactionStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    List<Transaction> findByUserId(UUID userId);
    long countByStatus(TransactionStatus status);
    long countByStatusIn(Collection<TransactionStatus> statuses);
    long countByUserIdAndStatusIn(UUID userId, Collection<TransactionStatus> statuses);
    long countByBookIdAndStatusIn(UUID bookId, Collection<TransactionStatus> statuses);
    List<Transaction> findByStatusInAndDueDateBefore(Collection<TransactionStatus> statuses, LocalDateTime date);
    
    // Required for the Automation Engine to find overdue items
    List<Transaction> findByStatusAndDueDateBefore(TransactionStatus status, LocalDateTime date);

    /** All transactions with a given status — used by ReportService for analytics. */
    List<Transaction> findByStatus(TransactionStatus status);

    /**
     * Fetches the 3 most-recently-issued transactions for a user, ordered by
     * checkout date descending.  Used by RecommendationService to build a
     * personalised semantic query from the user's reading history.
     *
     * Spring Data JPA resolves User_Id by traversing the @ManyToOne user
     * association and filtering on user.id.
     */
    List<Transaction> findTop3ByUser_IdOrderByCheckoutDateDesc(UUID userId);

    @Query("""
            SELECT t.book.id, t.book.title, COUNT(t.id)
            FROM Transaction t
            GROUP BY t.book.id, t.book.title
            ORDER BY COUNT(t.id) DESC
            """)
    List<Object[]> findTopBorrowedBooks(Pageable pageable);
}
