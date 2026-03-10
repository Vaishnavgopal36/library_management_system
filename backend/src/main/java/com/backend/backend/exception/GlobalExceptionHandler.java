package com.backend.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

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

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── 400 Bad Request — used for "entity not found" / bad input ──────────────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                safeMessage(ex, "The request could not be processed. Please check your input and try again.")
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
                safeMessage(ex, "This action cannot be completed right now. Please try again or contact support.")
        );
        problem.setTitle("Action Not Allowed");
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
                                fe -> fe.getDefaultMessage() == null ? "invalid value" : fe.getDefaultMessage(),
                                Collectors.toList()
                        )
                ));

        // Human-readable summary for the top-level 'detail' field
        String summary = fieldErrors.entrySet().stream()
                .map(e -> e.getKey() + ": " + String.join(", ", e.getValue()))
                .collect(Collectors.joining("; "));

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatusCode.valueOf(422),
                summary.isBlank() ? "Some fields are missing or have invalid values. Please review and try again." : summary
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
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "This action conflicts with existing data. The item may already exist or is still in use."
        );
        problem.setTitle("Data Conflict");
        problem.setType(URI.create("urn:problem:data-integrity"));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    // ── 400 Bad Request — malformed or unreadable request body ────────────────
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleUnreadableMessage(HttpMessageNotReadableException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "We couldn't read your request. Please make sure the data you submitted is correct."
        );
        problem.setTitle("Invalid Request Body");
        problem.setType(URI.create("urn:problem:bad-request"));
        return ResponseEntity.badRequest().body(problem);
    }

    // ── 400 Bad Request — missing required query/path parameter ───────────────
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ProblemDetail> handleMissingParam(MissingServletRequestParameterException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "A required field \"" + ex.getParameterName() + "\" is missing. Please fill in all required fields."
        );
        problem.setTitle("Missing Required Field");
        problem.setType(URI.create("urn:problem:bad-request"));
        return ResponseEntity.badRequest().body(problem);
    }

    // ── 404 Not Found — unmapped route ────────────────────────────────────────
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ProblemDetail> handleNoResource(NoResourceFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                "The page or resource you're looking for doesn't exist."
        );
        problem.setTitle("Not Found");
        problem.setType(URI.create("urn:problem:not-found"));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    // ── 405 Method Not Allowed ─────────────────────────────────────────────────
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ProblemDetail> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.METHOD_NOT_ALLOWED,
                "This action is not supported. Please check how you're using the feature."
        );
        problem.setTitle("Method Not Allowed");
        problem.setType(URI.create("urn:problem:method-not-allowed"));
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(problem);
    }

    // ── 401 Unauthorized — caught here as fallback ─────────────────────────────
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthentication(AuthenticationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "You need to log in to access this. Please sign in and try again."
        );
        problem.setTitle("Login Required");
        problem.setType(URI.create("urn:problem:unauthorized"));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
    }

    // ── 403 Forbidden — caught here as fallback ────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                "You don't have permission to perform this action. Contact an admin if you think this is a mistake."
        );
        problem.setTitle("Access Denied");
        problem.setType(URI.create("urn:problem:forbidden"));
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem);
    }

    // ── 500 Internal Server Error — unexpected catch-all ──────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex) {
        log.error("Unexpected error occurred", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong on our end. Please try again later. If the problem persists, contact support."
        );
        problem.setTitle("Unexpected Error");
        problem.setType(URI.create("urn:problem:internal-server-error"));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String safeMessage(RuntimeException ex, String fallback) {
        return ex.getMessage() == null || ex.getMessage().isBlank() ? fallback : ex.getMessage();
    }
}
