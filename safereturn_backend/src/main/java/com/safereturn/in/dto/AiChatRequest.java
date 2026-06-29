package com.safereturn.in.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body for POST /api/ai/chat
 *
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
 * history — last N turns sent from the frontend for conversational context.
 *           We accept up to 10 turns (20 messages) to keep prompt size bounded.
 */
public record AiChatRequest(

        @NotBlank(message = "Message must not be blank")
        @Size(max = 500, message = "Message must not exceed 500 characters")
        String message,

        @Size(max = 20, message = "History must not exceed 20 messages")
        List<ChatTurn> history
) {

    /**
     * A single turn in the conversation history.
     * role must be "user" or "assistant".
     */
    public record ChatTurn(String role, String content) {}
}