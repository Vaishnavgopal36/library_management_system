package com.backend.backend.service;

import com.backend.backend.dto.response.AuthorResponse;
import com.backend.backend.dto.response.BookResponse;
import com.backend.backend.dto.response.CategoryResponse;
import com.backend.backend.dto.response.PublisherResponse;
import com.backend.backend.entity.Book;
import com.backend.backend.repository.BookRepository;
import dev.langchain4j.model.embedding.EmbeddingModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SemanticSearchService {

    /** Cosine similarity floor — scores below this are too loose to be useful. */
    private static final double MIN_SIMILARITY = 0.4;

    /** Maximum number of books returned per semantic query. */
    private static final int MAX_RESULTS = 20;

    private final EmbeddingModel embeddingModel;
    private final BookRepository bookRepository;

    /**
     * Converts a free-text query into a vector embedding, runs an HNSW cosine
     * search against the books table, enriches results with true available stock,
     * and returns fully-populated BookResponse DTOs ordered by relevance.
     *
     * Query cost: 1 embedding inference (in-process) + 1 vector search + 1 batch
     * stock query = 2 database round-trips regardless of the number of results.
     *
     * @param queryText the user's natural-language search input
     * @return list of matching books, most semantically similar first
     */
    @Transactional(readOnly = true)
    public List<BookResponse> searchBooks(String queryText) {
        // Step 1 — encode the query into a 384-dim float vector (in-process, no I/O)
        float[] vector = embeddingModel.embed(queryText).content().vector();

        // Step 2 — convert float[] → pgvector literal "[0.1,0.2,...]"
        String queryVector = toVectorString(vector);

        log.debug("Semantic search for \"{}\": vector dim={}", queryText, vector.length);

        // Step 3 — HNSW cosine search via native query
        List<Book> books = bookRepository.findBySemanticSimilarity(queryVector, MIN_SIMILARITY, MAX_RESULTS);

        if (books.isEmpty()) {
            return Collections.emptyList();
        }

        // Step 4 — batch-fetch true available stock for all results in one round-trip
        List<UUID> bookIds = books.stream()
                .map(Book::getId)
                .collect(Collectors.toList());

        Map<UUID, Integer> stockMap = buildStockMap(bookRepository.getTrueAvailableStockBatch(bookIds));

        // Step 5 — map entities → response DTOs (preserves similarity-ordered list)
        return books.stream()
                .map(book -> mapToResponse(book, stockMap.getOrDefault(book.getId(), 0)))
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Converts a float[] vector to a pgvector string literal.
     *
     * Uses a pre-sized StringBuilder to avoid any intermediate String
     * allocations.  Each float32 value is at most ~14 chars; capacity is
     * estimated generously so no internal array resize is triggered.
     *
     * Example output: "[0.12345678,-0.9876543,...]"
     */
    private static String toVectorString(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 14 + 2);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(vector[i]);
        }
        sb.append(']');
        return sb.toString();
    }

    /**
     * Builds a fast UUID → stock lookup map from the raw Object[] rows
     * returned by {@code getTrueAvailableStockBatch}.
     *
     * Row layout (matches the native query in BookRepository):
     *   row[0] — book_id as VARCHAR
     *   row[1] — true_available_stock as INTEGER
     */
    private static Map<UUID, Integer> buildStockMap(List<Object[]> rows) {
        Map<UUID, Integer> map = new HashMap<>(rows.size() * 2);
        for (Object[] row : rows) {
            UUID bookId = UUID.fromString((String) row[0]);
            int  stock  = ((Number) row[1]).intValue();
            map.put(bookId, stock);
        }
        return map;
    }

    /**
     * Maps a Book entity and its pre-computed stock value to a BookResponse DTO.
     * Mirrors the same logic in BookService to keep the DTO contract consistent.
     * Zero additional queries are executed here — all data is already loaded.
     */
    private static BookResponse mapToResponse(Book book, int trueStock) {
        List<AuthorResponse> authors = book.getAuthors() == null
                ? Collections.emptyList()
                : book.getAuthors().stream()
                        .map(a -> AuthorResponse.builder()
                                .id(a.getId())
                                .name(a.getName())
                                .build())
                        .sorted(Comparator.comparing(AuthorResponse::getName,
                                String.CASE_INSENSITIVE_ORDER))
                        .collect(Collectors.toList());

        List<CategoryResponse> categories = book.getCategories() == null
                ? Collections.emptyList()
                : book.getCategories().stream()
                        .map(c -> CategoryResponse.builder()
                                .id(c.getId())
                                .name(c.getName())
                                .build())
                        .sorted(Comparator.comparing(CategoryResponse::getName,
                                String.CASE_INSENSITIVE_ORDER))
                        .collect(Collectors.toList());

        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .isbn(book.getIsbn())
                .publishDate(book.getPublishDate() != null
                        ? book.getPublishDate().toString()
                        : null)
                .stockQuantity(book.getStockQuantity())
                .trueAvailableStock(trueStock)
                .isArchived(book.getIsArchived())
                .publisher(book.getPublisher() == null
                        ? null
                        : PublisherResponse.builder()
                                .id(book.getPublisher().getId())
                                .name(book.getPublisher().getName())
                                .build())
                .authors(authors)
                .categories(categories)
                .build();
    }
}
