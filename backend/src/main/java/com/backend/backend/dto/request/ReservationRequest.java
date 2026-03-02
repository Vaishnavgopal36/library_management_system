package com.backend.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data // Lombok annotation to automatically generate Getters, Setters, and toString methods
public class ReservationRequest {
    
    @NotNull(message = "Book ID is required")
    private UUID bookId;

    // For member flows this is derived from JWT and request value is ignored.
    private UUID userId;
}
