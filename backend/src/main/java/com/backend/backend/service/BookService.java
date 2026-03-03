 package com.backend.backend.service;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Join;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;  
import com.backend.backend.dto.request.BookRequest;
import com.backend.backend.dto.response.AuthorResponse;
import com.backend.backend.dto.response.BookResponse;
import com.backend.backend.dto.response.CategoryResponse;
import com.backend.backend.dto.response.PublisherResponse;
import com.backend.backend.entity.Author;
import com.backend.backend.entity.Book;
import com.backend.backend.entity.Category;
import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.repository.BookRepository;
import com.backend.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.JoinType;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

    private static final List<TransactionStatus> ACTIVE_BORROW_STATUSES =
            List.of(TransactionStatus.issued, TransactionStatus.overdue, TransactionStatus.lost);

    private final BookRepository bookRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public Page<BookResponse> getAllActiveBooks(Pageable pageable) {
        Page<Book> bookPage = bookRepository.findByIsArchivedFalse(pageable);
        
        return bookPage.map(this::mapToResponse); 
    }

    @Transactional(readOnly = true)
    public BookResponse getBookById(UUID id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Book not found"));
        return mapToResponse(book);
    }

    @Transactional
    public BookResponse createBook(BookRequest request) {
        Book book = Book.builder()
                .title(request.getTitle())
                .isbn(request.getIsbn())
                .stockQuantity(request.getStockQuantity())
                .isArchived(false)
                .build();

        Book savedBook = bookRepository.save(book);
        return mapToResponse(savedBook);
    }

    @Transactional
    public BookResponse updateBook(UUID id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Book not found"));

        book.setTitle(request.getTitle());
        book.setIsbn(request.getIsbn());
        book.setStockQuantity(request.getStockQuantity());
        
        Book updatedBook = bookRepository.save(book);
        return mapToResponse(updatedBook);
    }

    @Transactional
    public void archiveBook(UUID id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Book not found"));

        long activeTransactions = transactionRepository.countByBookIdAndStatusIn(id, ACTIVE_BORROW_STATUSES);
        if (activeTransactions > 0) {
            throw new IllegalStateException(
                    "Cannot delete/archive book. It currently has " + activeTransactions + " active borrow transaction(s)."
            );
        }
        
        book.setIsArchived(true);
        bookRepository.save(book);
    }
    




    public Page<BookResponse> searchCatalog(
            String title,
            String authorName,
            String categoryName,
            UUID categoryId,
            String isbn,
            UUID bookId,
            Pageable pageable
    ) {
        Specification<Book> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            query.distinct(true);

            // Search endpoint should only expose active catalog entries.
            predicates.add(cb.isFalse(root.get("isArchived")));
            
            if (title != null && !title.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }
            if (isbn != null && !isbn.isBlank()) {
                predicates.add(cb.equal(root.get("isbn"), isbn));
            }
            if (bookId != null) {
                predicates.add(cb.equal(root.get("id"), bookId));
            }
            if (authorName != null && !authorName.isBlank()) {
                Join<Book, Author> authorJoin = root.join("authors", JoinType.INNER);
                predicates.add(cb.like(cb.lower(authorJoin.get("name")), "%" + authorName.toLowerCase() + "%"));
            }
            if ((categoryName != null && !categoryName.isBlank()) || categoryId != null) {
                Join<Book, Category> categoryJoin = root.join("categories", JoinType.INNER);
                if (categoryName != null && !categoryName.isBlank()) {
                    predicates.add(cb.like(cb.lower(categoryJoin.get("name")), "%" + categoryName.trim().toLowerCase() + "%"));
                }
                if (categoryId != null) {
                    predicates.add(cb.equal(categoryJoin.get("id"), categoryId));
                }
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return bookRepository.findAll(spec, pageable).map(this::mapToResponse);
    }




    private BookResponse mapToResponse(Book book) {
        Integer dynamicStock = bookRepository.getTrueAvailableStock(book.getId());
        List<AuthorResponse> authors = book.getAuthors() == null
                ? Collections.emptyList()
                : book.getAuthors().stream()
                .map(author -> AuthorResponse.builder()
                        .id(author.getId())
                        .name(author.getName())
                        .build())
                .sorted(Comparator.comparing(AuthorResponse::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
        List<CategoryResponse> categories = book.getCategories() == null
                ? Collections.emptyList()
                : book.getCategories().stream()
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .build())
                .sorted(Comparator.comparing(CategoryResponse::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
        
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .isbn(book.getIsbn())
                .stockQuantity(book.getStockQuantity())
                .trueAvailableStock(dynamicStock != null ? dynamicStock : 0)
                .isArchived(book.getIsArchived())
                .publisher(book.getPublisher() == null ? null : PublisherResponse.builder()
                        .id(book.getPublisher().getId())
                        .name(book.getPublisher().getName())
                        .build())
                .authors(authors)
                .categories(categories)
                .build();
    }
}
