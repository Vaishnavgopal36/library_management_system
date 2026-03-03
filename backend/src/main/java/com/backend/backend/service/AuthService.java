package com.backend.backend.service;

import com.backend.backend.dto.request.LoginRequest;
import com.backend.backend.dto.request.RegisterRequest;
import com.backend.backend.entity.User;
import com.backend.backend.entity.enums.UserRole;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use.");
        }

        UserRole requestedRole = request.getRole() == null ? UserRole.member : request.getRole();
        if (requestedRole != UserRole.member) {
            throw new IllegalArgumentException("Only member registration is allowed.");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(resolveDisplayName(request))
                .role(UserRole.member)
                .isActive(true)
                .build();

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User authenticateUser(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        if (!user.getIsActive()) {
            throw new IllegalStateException("Account is deactivated. Please contact an admin.");
        }

        return user;
    }

    private String resolveDisplayName(RegisterRequest request) {
        String fullName = request.getFullName();
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }

        // Fallback keeps registration working for payloads without fullName.
        String email = request.getEmail();
        if (email == null || email.isBlank()) {
            return null;
        }
        int atIndex = email.indexOf('@');
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }
}
