package com.backend.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Audited
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "category_id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    // @NotAudited: Envers tracks the join table from the owning side (Book).
    // Auditing this inverse side would cause duplicate / conflicting audit records.
    @NotAudited
    @ManyToMany(mappedBy = "categories", fetch = FetchType.LAZY)
    private Set<Book> books;
}