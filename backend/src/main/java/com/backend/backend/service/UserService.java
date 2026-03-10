package com.backend.backend.service;

import com.backend.backend.dto.request.UserUpdateRequest;
import com.backend.backend.dto.response.UserResponse;
import com.backend.backend.entity.User;
import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.entity.enums.UserRole;
import jakarta.persistence.criteria.Predicate;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
        return searchUsers(null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(
            UUID userId,
            String email,
            String fullName,
            String role,
            Boolean isActive
    ) {
        UserRole parsedRole = parseRole(role);
        Specification<User> spec = buildUserSpecification(null, userId, email, fullName, parsedRole, isActive);
        return userRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(
            String search,
            UUID userId,
            String email,
            String fullName,
            String role,
            Boolean isActive,
            Pageable pageable
    ) {
        UserRole parsedRole = parseRole(role);
        Specification<User> spec = buildUserSpecification(search, userId, email, fullName, parsedRole, isActive);

        Pageable effectivePageable = pageable.getSort().isUnsorted()
                ? PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"))
                : pageable;

        return userRepository.findAll(spec, effectivePageable).map(this::mapToResponse);
    }

    private Specification<User> buildUserSpecification(
            String search,
            UUID userId,
            String email,
            String fullName,
            UserRole parsedRole,
            Boolean isActive
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (userId != null) {
                predicates.add(cb.equal(root.get("id"), userId));
            }
            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), keyword),
                        cb.like(cb.lower(root.get("fullName")), keyword)
                ));
            }
            if (email != null && !email.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("email")), "%" + email.trim().toLowerCase() + "%"));
            }
            if (fullName != null && !fullName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("fullName")), "%" + fullName.trim().toLowerCase() + "%"));
            }
            if (parsedRole != null) {
                predicates.add(cb.equal(root.get("role"), parsedRole));
            }
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that member account."));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UserUpdateRequest request, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("Your session could not be verified. Please log out and sign in again."));
        boolean requesterIsAdmin = requester.getRole() == UserRole.admin;
        if (!requesterIsAdmin && !requester.getId().equals(id)) {
            throw new IllegalArgumentException("You can only update your own profile.");
        }

        User userToUpdate = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that member account."));

        // Enforce soft-delete through DELETE endpoint only.
        if (Boolean.FALSE.equals(request.getIsActive())) {
            throw new IllegalArgumentException("Account deactivation must be done through the Remove Member action.");
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
                .orElseThrow(() -> new IllegalArgumentException("We couldn't find that member account."));

        BigDecimal totalUnpaidFines = fineRepository.sumUnpaidAmountByUserId(id);
        if (totalUnpaidFines != null && totalUnpaidFines.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException(
                    "This member cannot be removed because they have an outstanding fine of $" + totalUnpaidFines +
                    ". Please settle the fine first."
            );
        }

        long activeTransactions = transactionRepository.countByUserIdAndStatusIn(id, ACTIVE_BORROW_STATUSES);
        if (activeTransactions > 0) {
            throw new IllegalStateException(
                    "This member cannot be removed because they currently have " + activeTransactions +
                    " book(s) borrowed. Please wait for the books to be returned."
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
                .role(user.getRole() == null ? null : user.getRole().name())
                .isActive(user.getIsActive())
                .build();
    }

    private UserRole parseRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }

        try {
            return UserRole.valueOf(role.trim().toLowerCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid role filter. Please use: member or admin.");
        }
    }
}
