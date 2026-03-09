package com.backend.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private UUID id;
    private UUID bookId;
    private UUID userId;
    private String bookName;
    private String userName;
    private LocalDateTime checkoutDate;
    private LocalDateTime dueDate;
    private LocalDateTime returnDate;
    private String status;
    /** Sum of all fine records charged against this transaction. Null / 0 means no fine. */
    private BigDecimal totalAccruedFine;
}
