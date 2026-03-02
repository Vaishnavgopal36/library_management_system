package com.backend.backend.controller;

import com.backend.backend.dto.request.BookRequest;
import com.backend.backend.dto.response.BookResponse;
import com.backend.backend.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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

    @GetMapping
    public ResponseEntity<Page<BookResponse>> searchCatalog(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String isbn,
            @RequestParam(required = false) UUID bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        // Pass the optional filters directly to your new Specification service method
        return ResponseEntity.ok(bookService.searchCatalog(
                title,
                author,
                category,
                categoryId,
                isbn,
                bookId,
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
        // Service should execute: UPDATE books SET is_archived = true WHERE id = ?
        bookService.archiveBook(id);
        return ResponseEntity.noContent().build();
    }
}
