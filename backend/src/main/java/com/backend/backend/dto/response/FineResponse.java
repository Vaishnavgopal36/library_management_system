package com.backend.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal; 
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FineResponse {
    private UUID id;
    private UUID transactionId;
    private UUID bookId;
    private UUID userId;
    private String bookName;
    private String userName;
    private BigDecimal amount; 
    private Boolean isPaid;
}
