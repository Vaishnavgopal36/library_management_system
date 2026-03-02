package com.backend.backend.controller;

import com.backend.backend.dto.response.FineResponse;
import com.backend.backend.service.FineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/fine")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;

    @GetMapping
    public ResponseEntity<List<FineResponse>> getLedger(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(isAdmin 
                ? fineService.getGlobalLedger() 
                : fineService.getUserLedger(authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> settleDebt(@PathVariable UUID id, @RequestBody Map<String, Boolean> payload) {
        // Soft delete equivalent for financial records: mark as paid
        if (Boolean.TRUE.equals(payload.get("is_paid"))) {
            return ResponseEntity.ok(fineService.settleFine(id));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Missing or invalid is_paid flag."));
    }
}