package com.backend.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthorResponse {
    private UUID id;
    private String name;
}
