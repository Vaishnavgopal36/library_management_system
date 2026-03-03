package com.backend.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", safeMessage(ex, "Invalid request.")));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalStateException(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", safeMessage(ex, "Operation cannot be completed in current state.")));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        if (ex.getBindingResult().getFieldError() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Validation failed."));
        }

        String field = ex.getBindingResult().getFieldError().getField();
        String defaultMessage = ex.getBindingResult().getFieldError().getDefaultMessage();
        String message = (defaultMessage == null || defaultMessage.isBlank())
                ? field + " is invalid"
                : field + ": " + defaultMessage;
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Operation violates data integrity constraints."));
    }

    private String safeMessage(RuntimeException ex, String fallback) {
        return ex.getMessage() == null || ex.getMessage().isBlank() ? fallback : ex.getMessage();
    }
}
