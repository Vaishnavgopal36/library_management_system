package com.backend.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
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
    
    // We pass the ID, not the whole Publisher object
    private UUID publisherId; 
}