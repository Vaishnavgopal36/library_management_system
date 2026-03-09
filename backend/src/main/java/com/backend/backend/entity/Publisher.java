package com.backend.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

import java.util.UUID;

@Entity
@Table(name = "publishers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Audited
public class Publisher {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "publisher_id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, unique = true, length = 255)
    private String name;
}