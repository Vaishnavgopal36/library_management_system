package com.backend.backend.controller;

import com.backend.backend.dto.request.ReservationRequest;
import com.backend.backend.dto.response.ReservationResponse;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservation")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getHolds(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(isAdmin 
                ? reservationService.getAllActiveHolds() 
                : reservationService.getUserHolds(authentication.getName()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createHold(@Valid @RequestBody ReservationRequest request, Authentication authentication) {
        try {
            UUID effectiveUserId = resolveEffectiveUserId(authentication, request.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(reservationService.createReservation(effectiveUserId, request.getBookId()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> dropHold(@PathVariable UUID id) {
        // Fulfills the OpenAPI DELETE requirement while adhering to Soft Delete
        reservationService.cancelReservation(id); 
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> resolveHold(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        String action = payload.get("status");
        try {
            if ("fulfilled".equalsIgnoreCase(action)) {
                reservationService.fulfillReservation(id);
                return ResponseEntity.ok(Map.of("message", "Reservation fulfilled."));
            } else if ("cancelled".equalsIgnoreCase(action)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Use DELETE /api/v1/reservation/{id} to cancel a reservation."));
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status action."));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private UUID resolveEffectiveUserId(Authentication authentication, UUID requestedUserId) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin && requestedUserId != null) {
            return requestedUserId;
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }
}
