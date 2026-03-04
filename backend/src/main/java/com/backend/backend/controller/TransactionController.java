package com.backend.backend.controller;

import com.backend.backend.dto.request.TransactionRequest;
import com.backend.backend.dto.response.TransactionResponse;
import com.backend.backend.repository.UserRepository;
import com.backend.backend.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transaction")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getCirculationHistory(
            Authentication authentication,
            @RequestParam(required = false) UUID transactionId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID bookId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkoutAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime checkoutBefore,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueAfter,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueBefore
    ) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return ResponseEntity.ok(transactionService.getGlobalHistory(
                    transactionId,
                    userId,
                    bookId,
                    status,
                    checkoutAfter,
                    checkoutBefore,
                    dueAfter,
                    dueBefore
            ));
        }

        UUID currentUserId = getAuthenticatedUserId(authentication);
        if (userId != null && !userId.equals(currentUserId)) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(transactionService.getUserHistory(
                authentication.getName(),
                transactionId,
                bookId,
                status,
                checkoutAfter,
                checkoutBefore,
                dueAfter,
                dueBefore
        ));
    }

    @PostMapping
    public ResponseEntity<?> issueAsset(@Valid @RequestBody TransactionRequest request, Authentication authentication) {
        try {
            UUID effectiveUserId = resolveEffectiveUserId(authentication, request.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(transactionService.issueBook(effectiveUserId, request.getBookId()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> returnAsset(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if ("returned".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(transactionService.returnBook(id));
        }
        if ("lost".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(transactionService.markLost(id));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid status action."));
    }

    private UUID resolveEffectiveUserId(Authentication authentication, UUID requestedUserId) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin && requestedUserId != null) {
            return requestedUserId;
        }

        return getAuthenticatedUserId(authentication);
    }

    private UUID getAuthenticatedUserId(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }
}
