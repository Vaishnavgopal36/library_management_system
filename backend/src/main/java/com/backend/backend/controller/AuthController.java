package com.backend.backend.controller;
import com.backend.backend.security.JwtUtil;
import com.backend.backend.dto.request.LoginRequest;
import com.backend.backend.dto.request.RegisterRequest;
import com.backend.backend.dto.response.AuthResponse;
import com.backend.backend.entity.User;
import com.backend.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil; 
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.registerUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User registered successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            User user = authService.authenticateUser(request);
            String normalizedRole = user.getRole().name().toUpperCase();
            
            String token = jwtUtil.generateToken(
                user.getEmail(), 
                normalizedRole,
                user.getId().toString()
        );
            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .role(normalizedRole)
                    .build();

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }
}
