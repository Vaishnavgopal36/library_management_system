package com.backend.backend.repository;

import com.backend.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    // Used by JwtAuthenticationFilter and CustomUserDetailsService
    Optional<User> findByEmail(String email);
    
    // Used by ReportService for analytics
    long countByIsActiveTrue();
    boolean existsByEmail(String email);
}