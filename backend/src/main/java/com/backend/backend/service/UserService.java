package com.backend.backend.service;

import com.backend.backend.dto.request.UserUpdateRequest;
import com.backend.backend.dto.response.UserResponse;
import com.backend.backend.entity.User;
import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final List<TransactionStatus> ACTIVE_BORROW_STATUSES =
            List.of(TransactionStatus.issued, TransactionStatus.overdue, TransactionStatus.lost);

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final FineRepository fineRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UserUpdateRequest request, String requesterEmail) {
        User userToUpdate = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Enforce soft-delete through DELETE endpoint only.
        if (Boolean.FALSE.equals(request.getIsActive())) {
            throw new IllegalArgumentException("Use DELETE /api/v1/user/{id} for deactivation.");
        }
        if (Boolean.TRUE.equals(request.getIsActive())) {
            userToUpdate.setIsActive(true);
        }

        // Password update logic
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            userToUpdate.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getFullName() != null) {
            userToUpdate.setFullName(request.getFullName());
        }

        User updatedUser = userRepository.save(userToUpdate);
        return mapToResponse(updatedUser);
    }

    @Transactional
    public void deactivateUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        BigDecimal totalUnpaidFines = fineRepository.sumUnpaidAmountByUserId(id);
        if (totalUnpaidFines != null && totalUnpaidFines.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException(
                    "Cannot delete/deactivate user. User has unpaid fines totaling " + totalUnpaidFines + "."
            );
        }

        long activeTransactions = transactionRepository.countByUserIdAndStatusIn(id, ACTIVE_BORROW_STATUSES);
        if (activeTransactions > 0) {
            throw new IllegalStateException(
                    "Cannot delete/deactivate user. User has " + activeTransactions + " active borrowed book(s)."
            );
        }

        user.setIsActive(false);
        userRepository.save(user);
    }

    // Helper method to map Entity to DTO safely without exposing password hashes
    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .build();
    }
}
