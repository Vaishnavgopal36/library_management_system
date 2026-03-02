package com.backend.backend.repository;

import com.backend.backend.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BookRepository extends JpaRepository<Book, UUID>, JpaSpecificationExecutor<Book> {    
    // Ignores soft-deleted books and supports pagination for the catalog
    Page<Book> findByIsArchivedFalse(Pageable pageable);
    
    // Used by ReportService
    long countByIsArchivedFalse();

    // Custom Native Query to calculate dynamic stock in real-time
    // Adjust the table names ('transactions', 'reservations') if yours differ
    @Query(value = "SELECT b.stock_quantity - " +
                   "COALESCE((SELECT COUNT(*) FROM transactions t WHERE t.book_id = b.book_id AND t.status = 'issued'), 0) - " +
                   "COALESCE((SELECT COUNT(*) FROM reservations r WHERE r.book_id = b.book_id AND r.status = 'active'), 0) " +
                   "FROM books b WHERE b.book_id = :bookId", nativeQuery = true)
    Integer getTrueAvailableStock(@Param("bookId") UUID bookId);
}
