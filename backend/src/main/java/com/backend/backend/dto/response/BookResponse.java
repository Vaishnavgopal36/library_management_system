package com.backend.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class BookResponse {
    private UUID id;
    private String title;
    private String isbn;
    private Integer stockQuantity;
    private Integer trueAvailableStock; // This is the dynamic calculation
    private Boolean isArchived;
    private PublisherResponse publisher;
    private List<AuthorResponse> authors;
    private List<CategoryResponse> categories;
}
