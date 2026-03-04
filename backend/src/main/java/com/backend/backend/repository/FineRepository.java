package com.backend.backend.repository;

import com.backend.backend.entity.Fine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface FineRepository extends JpaRepository<Fine, UUID>, JpaSpecificationExecutor<Fine> {
    
    // Used by Member to view their specific fines
    List<Fine> findByUserId(UUID userId);

    // Used by ReportService to calculate total outstanding system debt
    // Uses JPQL (Entity properties) rather than native SQL
    @Query("SELECT SUM(f.amount) FROM Fine f WHERE f.isPaid = false")
    BigDecimal sumAmountByIsPaidFalse();

    @Query("SELECT SUM(f.amount) FROM Fine f WHERE f.isPaid = true")
    BigDecimal sumAmountByIsPaidTrue();

    @Query("SELECT SUM(f.amount) FROM Fine f WHERE f.user.id = :userId AND f.isPaid = false")
    BigDecimal sumUnpaidAmountByUserId(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fine f WHERE f.transaction.id = :transactionId")
    BigDecimal sumAmountByTransactionId(@Param("transactionId") UUID transactionId);
}
