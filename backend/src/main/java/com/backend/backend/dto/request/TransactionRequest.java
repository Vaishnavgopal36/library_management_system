package com.backend.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRequest {

    @NotNull(message = "Book ID is strictly required to issue an asset.")
    private UUID bookId;

    // For member flows this is derived from JWT and request value is ignored.
    private UUID userId;
}
