package com.backend.backend.controller;

import com.backend.backend.dto.request.BookRequest;
import com.backend.backend.dto.response.BookResponse;
import com.backend.backend.service.BookService;
import com.backend.backend.service.RecommendationService;
import com.backend.backend.service.SemanticSearchService;
import com.backend.backend.util.RestPage;

import java.util.List;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/book")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final SemanticSearchService semanticSearchService;
    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<RestPage<BookResponse>> searchCatalog(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String category,
            @RequestParam(name = "catagary", required = false) String legacyCategory,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String isbn,
            @RequestParam(required = false) UUID bookId,
            @RequestParam(defaultValue = "false") boolean includeArchived,
            @RequestParam(defaultValue = "false") boolean archivedOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean semantic) {

        if (semantic && title != null && !title.isBlank()) {
            List<BookResponse> smartResults = semanticSearchService.searchBooks(title);
            int sizeOrOne = Math.max(1, smartResults.size());
            RestPage<BookResponse> semanticPage = new RestPage<>(smartResults, 0, sizeOrOne, smartResults.size(), 1, true);
            return ResponseEntity.ok(semanticPage);
        }

        String effectiveCategory = (category == null || category.isBlank()) ? legacyCategory : category;

        return ResponseEntity.ok(bookService.searchCatalog(
                title,
                author,
                effectiveCategory,
                categoryId,
                isbn,
                bookId,
                includeArchived,
                archivedOnly,
                PageRequest.of(page, size)
        ));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookResponse> addAsset(@Valid @RequestBody BookRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.createBook(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookResponse> updateAsset(@PathVariable UUID id, @Valid @RequestBody BookRequest request) {
        return ResponseEntity.ok(bookService.updateBook(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> archiveAsset(@PathVariable UUID id) {
        bookService.archiveBook(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns personalised book recommendations for a user based on the
     * semantic similarity of their 3 most recently borrowed titles.
     * Falls back to a curated cold-start query for new members.
     *
     * Example: GET /api/v1/book/recommended?userId=<uuid>
     */
    @GetMapping("/recommended")
    public ResponseEntity<List<BookResponse>> getRecommendations(@RequestParam UUID userId) {
        return ResponseEntity.ok(recommendationService.getRecommendationsForUser(userId));
    }
}
