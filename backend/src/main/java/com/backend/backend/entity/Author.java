package com.backend.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "authors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Audited
public class Author {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "author_id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    // Inverse side of the ManyToMany relationship mapped in Book.java
    // @NotAudited: Envers tracks the join table from the owning side (Book).
    // Auditing this inverse side would cause duplicate / conflicting audit records.
    @NotAudited
    @ManyToMany(mappedBy = "authors", fetch = FetchType.LAZY)
    private Set<Book> books;
}