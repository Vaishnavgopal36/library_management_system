package com.backend.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String status;
}
