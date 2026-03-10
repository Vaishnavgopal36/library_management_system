package com.backend.backend.controller;
import com.backend.backend.security.JwtUtil;
import com.backend.backend.dto.request.LoginRequest;
import com.backend.backend.dto.request.RegisterRequest;
import com.backend.backend.dto.response.AuthResponse;
import com.backend.backend.entity.User;
import com.backend.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.security.authentication.event.AuthenticationFailureDisabledEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final ApplicationEventPublisher eventPublisher;

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
        // Build a token stub used only as the event carrier — never passed to the security context
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(request.getEmail(), null);
        try {
            User user = authService.authenticateUser(request);
            String normalizedRole = user.getRole().name().toUpperCase();
            String token = jwtUtil.generateToken(user.getEmail(), normalizedRole, user.getId().toString());

            // Publish success event so AuthenticationAuditListener can record it
            eventPublisher.publishEvent(new AuthenticationSuccessEvent(authToken));

            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .role(normalizedRole)
                    .build();
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            // Account deactivated
            eventPublisher.publishEvent(
                    new AuthenticationFailureDisabledEvent(authToken, new DisabledException(e.getMessage())));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            // Bad credentials or other input error
            eventPublisher.publishEvent(
                    new AuthenticationFailureBadCredentialsEvent(authToken, new BadCredentialsException(e.getMessage())));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }
}
