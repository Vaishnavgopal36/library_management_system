package com.backend.backend.service;

import com.backend.backend.dto.response.FineResponse;
import com.backend.backend.entity.Fine;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository fineRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<FineResponse> getGlobalLedger() {
        return fineRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FineResponse> getUserLedger(String email) {
        UUID userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();

        return fineRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FineResponse settleFine(UUID fineId) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new IllegalArgumentException("Fine record not found"));

        if (fine.getIsPaid()) {
            throw new IllegalStateException("Fine is already settled.");
        }

        fine.setIsPaid(true); // Soft Delete equivalent for financial obligations
        Fine updatedFine = fineRepository.save(fine);
        return mapToResponse(updatedFine);
    }

    private FineResponse mapToResponse(Fine fine) {
        String userName = fine.getUser().getFullName();
        if (userName == null || userName.isBlank()) {
            userName = fine.getUser().getEmail();
        }

        return FineResponse.builder()
                .id(fine.getId())
                .transactionId(fine.getTransaction().getId())
                .bookId(fine.getTransaction().getBook().getId())
                .userId(fine.getUser().getId())
                .bookName(fine.getTransaction().getBook().getTitle())
                .userName(userName)
                .amount(fine.getAmount())
                .isPaid(fine.getIsPaid())
                .build();
    }
}
