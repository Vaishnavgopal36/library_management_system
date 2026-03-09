package com.backend.backend.repository;

import com.backend.backend.entity.Publisher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PublisherRepository extends JpaRepository<Publisher, UUID> {
    boolean existsByName(String name);
    Optional<Publisher> findByNameIgnoreCase(String name);
}