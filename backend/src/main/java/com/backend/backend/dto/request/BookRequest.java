package com.backend.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class BookRequest {
    @NotBlank(message = "Title is mandatory")
    private String title;

    @NotBlank(message = "ISBN is mandatory")
    private String isbn;

    @NotNull(message = "Stock quantity is mandatory")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stockQuantity;

    private LocalDate publishDate;

    // Legacy: resolve publisher by UUID (kept for compatibility)
    private UUID publisherId;

    // Preferred: resolve publisher by name (find-or-create)
    private String publisherName;

    // Author and category names — backend will find-or-create each entry
    private List<String> authorNames;
    private List<String> categoryNames;

    // Optional — if provided, sets the archive status (used by PUT to unarchive)
    private Boolean isArchived;
}