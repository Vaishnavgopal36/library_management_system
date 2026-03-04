package com.backend.backend.service;

import com.backend.backend.dto.request.UserUpdateRequest;
import com.backend.backend.dto.response.UserResponse;
import com.backend.backend.entity.User;
import com.backend.backend.entity.enums.UserRole;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private FineRepository fineRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void memberCanUpdateOwnProfile() {
        UUID userId = UUID.randomUUID();
        String requesterEmail = "member@bookstop.com";

        User requester = User.builder()
                .id(userId)
                .email(requesterEmail)
                .role(UserRole.member)
                .isActive(true)
                .build();
        User target = User.builder()
                .id(userId)
                .email(requesterEmail)
                .role(UserRole.member)
                .isActive(true)
                .build();

        UserUpdateRequest request = UserUpdateRequest.builder()
                .fullName("Updated Member")
                .password("newpassword")
                .build();

        when(userRepository.findByEmail(requesterEmail)).thenReturn(Optional.of(requester));
        when(userRepository.findById(userId)).thenReturn(Optional.of(target));
        when(passwordEncoder.encode("newpassword")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.updateUser(userId, request, requesterEmail);

        assertEquals("Updated Member", response.getFullName());
        verify(userRepository).save(target);
    }

    @Test
    void memberCannotUpdateAnotherProfile() {
        UUID requesterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        String requesterEmail = "member@bookstop.com";

        User requester = User.builder()
                .id(requesterId)
                .email(requesterEmail)
                .role(UserRole.member)
                .isActive(true)
                .build();
        User target = User.builder()
                .id(targetId)
                .email("other@bookstop.com")
                .role(UserRole.member)
                .isActive(true)
                .build();

        when(userRepository.findByEmail(requesterEmail)).thenReturn(Optional.of(requester));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));

        UserUpdateRequest request = UserUpdateRequest.builder().fullName("Nope").build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> userService.updateUser(targetId, request, requesterEmail)
        );

        assertEquals("Members can update only their own profile.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void adminCanUpdateAnotherProfile() {
        UUID adminId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        String adminEmail = "admin@bookstop.com";

        User admin = User.builder()
                .id(adminId)
                .email(adminEmail)
                .role(UserRole.admin)
                .isActive(true)
                .build();
        User target = User.builder()
                .id(targetId)
                .email("member@bookstop.com")
                .role(UserRole.member)
                .isActive(true)
                .build();

        UserUpdateRequest request = UserUpdateRequest.builder()
                .fullName("Updated By Admin")
                .build();

        when(userRepository.findByEmail(adminEmail)).thenReturn(Optional.of(admin));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.updateUser(targetId, request, adminEmail);

        assertEquals("Updated By Admin", response.getFullName());
        verify(userRepository).save(target);
    }
}
