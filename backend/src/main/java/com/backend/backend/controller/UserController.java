package com.backend.backend.controller;

import com.backend.backend.dto.request.UserUpdateRequest;
import com.backend.backend.dto.response.UserResponse;
import com.backend.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getUsers(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            // Admin gets global user ledger
            return ResponseEntity.ok(userService.getAllUsers());
        } else {
            // Member gets an array containing only their own scoped profile
            String userEmail = authentication.getName();
            return ResponseEntity.ok(List.of(userService.getUserByEmail(userEmail)));
        }
        
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable UUID id, 
            @Valid @RequestBody UserUpdateRequest request,
            Authentication authentication) {
        try {
            return ResponseEntity.ok(userService.updateUser(id, request, authentication.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> archiveUser(@PathVariable UUID id) {
        // Triggers the soft delete logic in UserService
        // UPDATE users SET is_active = false WHERE id = ?
        userService.deactivateUser(id); 
        return ResponseEntity.noContent().build();
    }
}
