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
public class ReservationResponse {
    private UUID id;
    private UserResponse user;
    private BookResponse book;
    private LocalDateTime reservedAt;
    private LocalDateTime expiresAt;
    private String status;
}
