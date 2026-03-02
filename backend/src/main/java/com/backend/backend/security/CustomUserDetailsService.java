package com.backend.backend.security;

import com.backend.backend.entity.User;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User appUser = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Enforce Spring Security's strict ROLE_ prefix requirement
        String springRole = "ROLE_" + appUser.getRole().name().toUpperCase();

        return org.springframework.security.core.userdetails.User.builder()
                .username(appUser.getEmail())
                .password(appUser.getPasswordHash())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority(springRole)))
                .disabled(appUser.getIsActive() != null && !appUser.getIsActive())
                .build();
    }
}