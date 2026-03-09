package com.backend.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * RFC 7807 Problem Details for HTTP APIs.
 * All error responses conform to: { type, title, status, detail, [errors] }
 * Spring's ProblemDetail serialises to this shape automatically.
 *
 * STRICT POLICY: only exception-to-HTTP mappings live here.
 * No business logic is touched.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── 400 Bad Request — used for "entity not found" / bad input ──────────────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                safeMessage(ex, "Invalid request.")
        );
        problem.setTitle("Bad Request");
        problem.setType(URI.create("urn:problem:bad-request"));
        return ResponseEntity.badRequest().body(problem);
    }

    // ── 409 Conflict — used for business-rule violations (borrow limits, etc.) ─
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ProblemDetail> handleIllegalState(IllegalStateException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                safeMessage(ex, "Operation cannot be completed in current state.")
        );
        problem.setTitle("Conflict");
        problem.setType(URI.create("urn:problem:conflict"));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    // ── 422 Unprocessable Entity — Bean Validation failures (@Valid) ───────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex) {
        // Collect every field violation into { field -> [messages] }
        Map<String, List<String>> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.groupingBy(
                        FieldError::getField,
                        LinkedHashMap::new,
                        Collectors.mapping(
                                fe -> fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage(),
                                Collectors.toList()
                        )
                ));

        // Human-readable summary for the top-level 'detail' field
        String summary = fieldErrors.entrySet().stream()
                .map(e -> e.getKey() + ": " + String.join(", ", e.getValue()))
                .collect(Collectors.joining("; "));

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatusCode.valueOf(422),
                summary.isBlank() ? "Validation failed." : summary
        );
        problem.setTitle("Validation Failed");
        problem.setType(URI.create("urn:problem:validation-error"));
        // Attach the structured map so the frontend can highlight individual fields
        problem.setProperty("errors", fieldErrors);
        return ResponseEntity.status(422).body(problem);
    }

    // ── 409 Conflict — DB-level constraint violations ─────────────────────────
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> handleDataIntegrity(DataIntegrityViolationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "Operation violates data integrity constraints."
        );
        problem.setTitle("Conflict");
        problem.setType(URI.create("urn:problem:data-integrity"));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String safeMessage(RuntimeException ex, String fallback) {
        return ex.getMessage() == null || ex.getMessage().isBlank() ? fallback : ex.getMessage();
    }
}
