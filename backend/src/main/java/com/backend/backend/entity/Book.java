package com.backend.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Named entity graphs used by BookRepository to eliminate the N+1 problem.
 *
 * - BOOK_WITH_ALL_ASSOCIATIONS: used for single-entity lookups (findById).
 *   Safe to JOIN-FETCH all three associations because there is no pagination.
 *
 * - BOOK_WITH_PUBLISHER: used for paginated queries (findByIsArchivedFalse,
 *   Specification search).  Fetching @ManyToMany collections inside a
 *   paginated EntityGraph forces Hibernate into in-memory pagination
 *   (HHH90003004), which is worse than N+1 for large tables.  Instead, the
 *   @ManyToOne publisher is JOIN-fetched here, and the @ManyToMany collections
 *   are loaded in batches via @BatchSize on the fields below.
 */
@NamedEntityGraphs({
    @NamedEntityGraph(
        name = Book.GRAPH_WITH_ALL_ASSOCIATIONS,
        attributeNodes = {
            @NamedAttributeNode("authors"),
            @NamedAttributeNode("categories"),
            @NamedAttributeNode("publisher")
        }
    ),
    @NamedEntityGraph(
        name = Book.GRAPH_WITH_PUBLISHER,
        attributeNodes = {
            @NamedAttributeNode("publisher")
        }
    )
})
@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Audited
public class Book {

    /** Graph constant names — avoids magic strings in the repository. */
    public static final String GRAPH_WITH_ALL_ASSOCIATIONS = "Book.withAllAssociations";
    public static final String GRAPH_WITH_PUBLISHER        = "Book.withPublisher";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "book_id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "isbn", unique = true, length = 20)
    private String isbn;

    @Column(name = "publish_date")
    private LocalDate publishDate;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 1;

    @Column(name = "is_archived")
    @Builder.Default
    private Boolean isArchived = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publisher_id")
    private Publisher publisher;

    // Mapping the Join Tables exactly as defined in your DB schema.
    // @BatchSize: for paginated queries, Hibernate loads authors/categories for
    // the entire page in a single IN-clause query per collection
    // (e.g., WHERE author_id IN (?, ?, ...)) rather than one query per book.
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "book_authors",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    @BatchSize(size = 50)
    private Set<Author> authors;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "book_categories",
        joinColumns = @JoinColumn(name = "book_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @BatchSize(size = 50)
    private Set<Category> categories;

    /**
     * 384-dimensional sentence embedding from all-MiniLM-L6-v2.
     * Stored as pgvector(384); used exclusively for semantic search.
     * Excluded from Envers audit history — binary vector data has no
     * meaningful business audit trail and would bloat the audit table.
     */
    @NotAudited
    @JdbcTypeCode(SqlTypes.VECTOR)
    @Column(columnDefinition = "vector(384)")
    private float[] embedding;
}
