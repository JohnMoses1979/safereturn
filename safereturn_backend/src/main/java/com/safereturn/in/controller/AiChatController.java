package com.safereturn.in.controller;

import com.safereturn.in.dto.AiChatRequest;
import com.safereturn.in.dto.AiChatResponse;
import com.safereturn.in.service.AiChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI Chat endpoint.
 *
 *   POST /api/ai/chat
 *
 * Requires a valid Bearer JWT. The authenticated user's identity is taken
 * from the JWT — never from the request body — so one user cannot query
 * another user's private data.
 *
 * Request:
 * <pre>
 * {
 *   "message": "How many sightings were reported today?",
 *   "history": [
 *     { "role": "user",      "content": "Hello" },
 *     { "role": "assistant", "content": "Hi! How can I help?" }
 *   ]
 * }
 * </pre>
 *
 * Response:
 * <pre>
 * {
 *   "reply":       "There have been 3 sightings reported today (06 Jun 2026).",
 *   "contextUsed": "SIGHTINGS,DASHBOARD"
 * }
 * </pre>
 */
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            Authentication authentication,
            @Valid @RequestBody AiChatRequest request
    ) {
        String userEmail = authentication.getName();
        AiChatResponse response = aiChatService.chat(userEmail, request);
        return ResponseEntity.ok(response);
    }
}