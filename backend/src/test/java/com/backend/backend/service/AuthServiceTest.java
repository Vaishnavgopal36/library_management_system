package com.backend.backend.service;

import com.backend.backend.dto.request.RegisterRequest;
import com.backend.backend.entity.User;
import com.backend.backend.entity.enums.UserRole;
import com.backend.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerUserRejectsAdminRole() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("admin2@bookstop.com");
        request.setPassword("securepassword");
        request.setFullName("System Admin");
        request.setRole(UserRole.admin);

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authService.registerUser(request)
        );

        assertEquals("Only member registration is allowed.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUserSavesMemberWhenRoleIsNull() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("member@bookstop.com");
        request.setPassword("securepassword");
        request.setFullName("Library Member");
        request.setRole(null);

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.registerUser(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals(UserRole.member, userCaptor.getValue().getRole());
    }
}
