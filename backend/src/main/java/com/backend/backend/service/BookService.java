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
import com.backend.backend.util.RestPage;
import com.backend.backend.entity.Author;
import com.backend.backend.entity.Book;
import com.backend.backend.entity.Category;
import com.backend.backend.entity.Publisher;
import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.repository.AuthorRepository;
import com.backend.backend.repository.BookRepository;
import com.backend.backend.repository.CategoryRepository;
import com.backend.backend.repository.PublisherRepository;
import com.backend.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.JoinType;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

    private static final List<TransactionStatus> ACTIVE_BORROW_STATUSES =
            List.of(TransactionStatus.issued, TransactionStatus.overdue, TransactionStatus.lost);

    private final BookRepository bookRepository;
    private final TransactionRepository transactionRepository;
    private final AuthorRepository authorRepository;
    private final CategoryRepository categoryRepository;
    private final PublisherRepository publisherRepository;

    @Cacheable(
            value = "books",
            key = "#root.methodName + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    @Transactional(readOnly = true)
    public RestPage<BookResponse> getAllActiveBooks(Pageable pageable) {
        Page<Book> bookPage = bookRepository.findByIsArchivedFalse(pageable);
        // One batch query for the entire page — not one query per book.
        Map<UUID, Integer> stockMap = fetchStockMap(bookPage.map(Book::getId).toList());
        return RestPage.of(bookPage.map(book -> mapToResponse(book, stockMap.getOrDefault(book.getId(), 0))));
    }

    @Transactional(readOnly = true)
    public BookResponse getBookById(UUID id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that book. It may have been removed."));
        Map<UUID, Integer> stockMap = fetchStockMap(List.of(id));
        return mapToResponse(book, stockMap.getOrDefault(id, 0));
    }

    @CacheEvict(value = "books", allEntries = true)
    @Transactional
    public BookResponse createBook(BookRequest request) {
        Publisher publisher = resolvePublisher(request.getPublisherName());
        Set<Author> authors = resolveAuthors(request.getAuthorNames());
        Set<Category> categories = resolveCategories(request.getCategoryNames());

        Book book = Book.builder()
                .title(request.getTitle())
                .isbn(request.getIsbn())
                .stockQuantity(request.getStockQuantity())
                .isArchived(false)
                .publisher(publisher)
                .authors(authors)
                .categories(categories)
                .build();

        Book savedBook = bookRepository.save(book);
        Map<UUID, Integer> stockMap = fetchStockMap(List.of(savedBook.getId()));
        return mapToResponse(savedBook, stockMap.getOrDefault(savedBook.getId(), 0));
    }

    @CacheEvict(value = "books", allEntries = true)
    @Transactional
    public BookResponse updateBook(UUID id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that book. It may have been removed."));

        book.setTitle(request.getTitle());
        book.setIsbn(request.getIsbn());
        book.setStockQuantity(request.getStockQuantity());

        if (request.getPublisherName() != null) {
            book.setPublisher(resolvePublisher(request.getPublisherName()));
        }
        if (request.getAuthorNames() != null) {
            book.setAuthors(resolveAuthors(request.getAuthorNames()));
        }
        if (request.getCategoryNames() != null) {
            book.setCategories(resolveCategories(request.getCategoryNames()));
        }
        if (request.getIsArchived() != null) {
            book.setIsArchived(request.getIsArchived());
        }

        Book updatedBook = bookRepository.save(book);
        Map<UUID, Integer> stockMap = fetchStockMap(List.of(updatedBook.getId()));
        return mapToResponse(updatedBook, stockMap.getOrDefault(updatedBook.getId(), 0));
    }

    @CacheEvict(value = "books", allEntries = true)
    @Transactional
    public void archiveBook(UUID id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that book. It may have been removed."));

        long activeTransactions = transactionRepository.countByBookIdAndStatusIn(id, ACTIVE_BORROW_STATUSES);
        if (activeTransactions > 0) {
            throw new IllegalStateException(
                    "This book cannot be removed right now because " + activeTransactions +
                    " member(s) currently have it borrowed. Please wait until all copies are returned."
            );
        }
        
        book.setIsArchived(true);
        bookRepository.save(book);
    }
    




    @Cacheable(
            value = "books",
            key = "#root.methodName + '-' + #pageable.pageNumber + '-' + #pageable.pageSize" +
                  " + '-' + #title + '-' + #authorName + '-' + #categoryName + '-' + #categoryId" +
                  " + '-' + #isbn + '-' + #bookId + '-' + #includeArchived + '-' + #archivedOnly")
    public RestPage<BookResponse> searchCatalog(
            String title,
            String authorName,
            String categoryName,
            UUID categoryId,
            String isbn,
            UUID bookId,
            boolean includeArchived,
            boolean archivedOnly,
            Pageable pageable
    ) {
        Specification<Book> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            query.distinct(true);

            // Filter by archive status.
            if (archivedOnly) {
                predicates.add(cb.isTrue(root.get("isArchived")));
            } else if (!includeArchived) {
                predicates.add(cb.isFalse(root.get("isArchived")));
            }
            
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

        Page<Book> bookPage = bookRepository.findAll(spec, pageable);
        // One batch query for the entire page — not one query per book.
        Map<UUID, Integer> stockMap = fetchStockMap(bookPage.map(Book::getId).toList());
        return RestPage.of(bookPage.map(book -> mapToResponse(book, stockMap.getOrDefault(book.getId(), 0))));
    }

    // ── Stock batch helper ────────────────────────────────────────────────────

    /**
     * Fetches true available stock for a collection of book IDs in a SINGLE
     * SQL query.  Replaces the previous per-book getTrueAvailableStock(UUID)
     * call that was firing inside mapToResponse, causing N+1.
     *
     * Safe for empty collections: returns an empty map immediately without
     * hitting the database.
     */
    private Map<UUID, Integer> fetchStockMap(Collection<UUID> bookIds) {
        if (bookIds == null || bookIds.isEmpty()) return Collections.emptyMap();
        List<Object[]> rows = bookRepository.getTrueAvailableStockBatch(bookIds);
        Map<UUID, Integer> map = new HashMap<>(rows.size());
        for (Object[] row : rows) {
            UUID id    = UUID.fromString(row[0].toString());
            int  stock = row[1] == null ? 0 : ((Number) row[1]).intValue();
            map.put(id, stock);
        }
        return map;
    }

    // ── Find-or-create helpers ────────────────────────────────────────────────

    private Publisher resolvePublisher(String name) {
        if (name == null || name.isBlank()) return null;
        return publisherRepository.findByNameIgnoreCase(name.trim())
                .orElseGet(() -> publisherRepository.save(
                        Publisher.builder().name(name.trim()).build()));
    }

    private Set<Author> resolveAuthors(List<String> names) {
        Set<Author> set = new HashSet<>();
        if (names == null) return set;
        for (String name : names) {
            if (name == null || name.isBlank()) continue;
            set.add(authorRepository.findByNameIgnoreCase(name.trim())
                    .orElseGet(() -> authorRepository.save(
                            Author.builder().name(name.trim()).build())));
        }
        return set;
    }

    private Set<Category> resolveCategories(List<String> names) {
        Set<Category> set = new HashSet<>();
        if (names == null) return set;
        for (String name : names) {
            if (name == null || name.isBlank()) continue;
            set.add(categoryRepository.findByNameIgnoreCase(name.trim())
                    .orElseGet(() -> categoryRepository.save(
                            Category.builder().name(name.trim()).build())));
        }
        return set;
    }

    /**
     * Maps a Book entity to its response DTO using a pre-computed stock value.
     * The stock is resolved externally (via fetchStockMap) so this method
     * performs zero additional database queries.
     */
    private BookResponse mapToResponse(Book book, int trueStock) {
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
                .publishDate(book.getPublishDate() != null ? book.getPublishDate().toString() : null)
                .stockQuantity(book.getStockQuantity())
                .trueAvailableStock(trueStock)
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
