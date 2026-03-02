package com.backend.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    // All fields are optional because a PUT request might only update one thing
    private String fullName;
    private String password;
    private Boolean isActive;
}