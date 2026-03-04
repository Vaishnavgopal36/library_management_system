package com.backend.backend.controller;

import com.backend.backend.dto.request.UserUpdateRequest;
import com.backend.backend.dto.response.UserResponse;
import com.backend.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<Page<UserResponse>> getUsers(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        PageRequest pageable = PageRequest.of(page, size);

        if (isAdmin) {
            return ResponseEntity.ok(userService.searchUsers(
                    search,
                    userId,
                    email,
                    fullName,
                    role,
                    isActive,
                    pageable
            ));
        } else {
            UserResponse currentUser = userService.getUserByEmail(authentication.getName());
            return ResponseEntity.ok(userService.searchUsers(
                    search,
                    currentUser.getId(),
                    email,
                    fullName,
                    role,
                    isActive,
                    pageable
            ));
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
