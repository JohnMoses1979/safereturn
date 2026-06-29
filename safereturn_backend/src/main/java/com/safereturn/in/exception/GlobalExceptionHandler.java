package com.safereturn.in.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ─── Validation errors (400) ──────────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                (first, second) -> first   // keep first message per field
            ));

        return ResponseEntity.badRequest().body(errorBody(400, "Validation failed", fieldErrors));
    }

    // ─── OTP errors (422) ────────────────────────────────────────────────────
    @ExceptionHandler(OtpException.class)
    public ResponseEntity<Map<String, Object>> handleOtp(OtpException ex) {
        return ResponseEntity.unprocessableEntity()
            .body(errorBody(422, ex.getMessage(), null));
    }

    // ─── Duplicate / conflict (409) ──────────────────────────────────────────
    @ExceptionHandler(RegistrationException.class)
    public ResponseEntity<Map<String, Object>> handleRegistration(RegistrationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(errorBody(409, ex.getMessage(), null));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArg(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(errorBody(409, ex.getMessage(), null));
    }

    // ─── Auth errors (401) ───────────────────────────────────────────────────
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(errorBody(401, "Invalid email or password.", null));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> handleDisabled(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(errorBody(401, "Account is not active. Please complete OTP verification.", null));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.error("Database constraint violation: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(errorBody(409, "Database constraint violation: " + safeMessage(ex), null));
    }

    // ─── Catch-all (500) ─────────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.internalServerError()
            .body(errorBody(500, "Unexpected server error: " + safeMessage(ex), null));
    }

    // ─── Helper ──────────────────────────────────────────────────────────────
    private Map<String, Object> errorBody(int status, String message, Object details) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status);
        body.put("message", message);
        if (details != null) body.put("errors", details);
        return body;
    }

    private String safeMessage(Exception ex) {
        String message = ex.getMessage();
        return (message == null || message.isBlank())
            ? ex.getClass().getSimpleName()
            : message;
    }
}
