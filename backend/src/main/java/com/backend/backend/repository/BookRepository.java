package com.backend.backend.repository;

import com.backend.backend.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookRepository extends JpaRepository<Book, UUID>, JpaSpecificationExecutor<Book> {

    /**
     * Paginated catalog listing — eliminates the N+1 problem for the publisher
     * association with a single LEFT JOIN in the SELECT query.
     *
     * The @ManyToMany associations (authors, categories) are NOT included in
     * the EntityGraph here because joining two collections inside a paginated
     * query forces Hibernate to apply pagination in-memory instead of at the
     * SQL level (HHH90003004).  Instead, @BatchSize(50) on those fields in
     * Book.java causes Hibernate to load them for the whole page in a single
     * IN-clause query each — reducing N×2 queries to just 2 extra queries
     * regardless of page size.
     *
     * Net result for a page of 20 books:
     *   Before : 1 + 20 + 20 + 20 = 61 queries
     *   After  : 1 (books+publisher JOIN) + 1 (batch authors) + 1 (batch categories) = 3 queries
     */
    @EntityGraph(value = Book.GRAPH_WITH_PUBLISHER)
    Page<Book> findByIsArchivedFalse(Pageable pageable);

    /**
     * Single-entity lookup — safe to eagerly JOIN-FETCH all three associations
     * (no pagination, so no in-memory pagination risk from the Cartesian product).
     * Reduces 4 queries (book + authors + categories + publisher) to 1 query.
     */
    @Override
    @EntityGraph(value = Book.GRAPH_WITH_ALL_ASSOCIATIONS)
    Optional<Book> findById(UUID id);

    /**
     * Dynamic search via Specification — same paginated strategy as
     * findByIsArchivedFalse: JOIN-fetch the @ManyToOne publisher in SQL,
     * batch-load the @ManyToMany collections via @BatchSize.
     *
     * Spring Data JPA automatically generates a separate COUNT(*) query for the
     * Page metadata; the EntityGraph is NOT applied to that count query.
     */
    @Override
    @EntityGraph(value = Book.GRAPH_WITH_PUBLISHER)
    Page<Book> findAll(Specification<Book> spec, Pageable pageable);

    // Used by ReportService
    long countByIsArchivedFalse();

    /**
     * Batch stock calculation — eliminates the N+1 problem that existed when
     * getTrueAvailableStock(UUID) was called once per book inside a stream.
     *
     * This single native query returns one row per book ID in the supplied
     * collection, computing the true available stock inline via correlated
     * subqueries that run entirely inside the database in one round-trip.
     *
     * Usage: collect all IDs from the current page, call this once, then
     * build a Map<UUID, Integer> for O(1) lookup in the mapping layer.
     *
     * Query count comparison for a page of N books:
     *   Before (per-book): 1 (page fetch) + N (stock per book) = N+1 queries
     *   After  (batch)   : 1 (page fetch) + 1 (all N stocks)  = 2 queries always
     *
     * Returns Object[] rows where:
     *   row[0] — book_id as VARCHAR (safe across JDBC drivers)
     *   row[1] — true_available_stock as INTEGER
     */
    @Query(value =
        "SELECT CAST(b.book_id AS VARCHAR) AS book_id, " +
        "       CAST( " +
        "         b.stock_quantity " +
        "         - COALESCE((SELECT COUNT(*) FROM transactions t " +
        "                     WHERE t.book_id = b.book_id AND t.status = 'issued'), 0) " +
        "         - COALESCE((SELECT COUNT(*) FROM reservations r " +
        "                     WHERE r.book_id = b.book_id AND r.status = 'active'), 0) " +
        "       AS INTEGER) AS true_available_stock " +
        "FROM books b " +
        "WHERE b.book_id IN :bookIds",
        nativeQuery = true)
    List<Object[]> getTrueAvailableStockBatch(@Param("bookIds") Collection<UUID> bookIds);
}
