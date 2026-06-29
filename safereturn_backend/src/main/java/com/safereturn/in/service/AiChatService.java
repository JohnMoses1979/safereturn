package com.safereturn.in.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.safereturn.in.dto.AiChatRequest;
import com.safereturn.in.dto.AiChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

/**
 * AiChatService
 *
 * Orchestrates:
 *  1. Build structured DB context via AiContextBuilder
 *  2. Assemble a Groq-compatible request (system + history + user message)
 *  3. POST to Groq /v1/chat/completions
 *  4. Parse and return the assistant reply
 *
 * The Groq API key is read from application.properties (groq.api.key).
 * It is NEVER exposed to the frontend.
 */
@Service
public class AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);

    // ── Configuration ────────────────────────────────────────────────────────

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    @Value("${groq.max-tokens:600}")
    private int maxTokens;

    @Value("${groq.temperature:0.35}")
    private double temperature;

    // ── Collaborators ────────────────────────────────────────────────────────

    private final AiContextBuilder contextBuilder;
    private final ObjectMapper     objectMapper;
    private final HttpClient       httpClient;

    public AiChatService(AiContextBuilder contextBuilder, ObjectMapper objectMapper) {
        this.contextBuilder = contextBuilder;
        this.objectMapper   = objectMapper;
        this.httpClient     = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    // ── System prompt template ────────────────────────────────────────────────

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            You are SafeReturn AI Assistant — a concise, factual assistant embedded in the SafeReturn missing-persons platform.

            Your responsibilities:
            - Answer questions about missing person reports, sightings, alerts, saved persons, and rewards.
            - Use ONLY the data provided in the LIVE DATABASE CONTEXT section below.
            - Never invent, guess, or extrapolate data not present in the context.
            - Keep replies short, clear, and human-readable. Plain text only — no markdown, no HTML.
            - If the user asks about emergency situations, always tell them to call 112 immediately.
            - For identity from images, say "Admin verification is required" and do not make identity claims.
            - If the database context shows no data, say so honestly (e.g., "You have no saved reports yet.").
            - Do not reveal internal field names, IDs, or technical details unless explicitly asked.
            - Be empathetic — these are real missing-persons cases involving real families.

            %s
            """;

    // ── Public API ───────────────────────────────────────────────────────────

    /**
     * Process one chat turn.
     *
     * @param userEmail  authenticated user's email (from JWT, never from request body)
     * @param request    the validated request DTO
     * @return           the assistant reply and context metadata
     */
    public AiChatResponse chat(String userEmail, AiChatRequest request) {
        // 1. Build DB context
        AiContextBuilder.BuildResult ctx = contextBuilder.build(userEmail, request.message());

        // 2. Build system prompt
        String systemPrompt = String.format(SYSTEM_PROMPT_TEMPLATE, ctx.contextBlock());

        // 3. Build Groq messages array
        ArrayNode messages = objectMapper.createArrayNode();
        addMessage(messages, "system", systemPrompt);

        // Inject conversation history (validated max 20 items in DTO)
        if (request.history() != null) {
            for (AiChatRequest.ChatTurn turn : request.history()) {
                String role = sanitizeRole(turn.role());
                String content = sanitize(turn.content());
                if (!content.isBlank()) {
                    addMessage(messages, role, content);
                }
            }
        }

        // Current user message
        addMessage(messages, "user", sanitize(request.message()));

        // 4. Build request body
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model",       groqModel);
        body.put("max_tokens",  maxTokens);
        body.put("temperature", temperature);
        body.set("messages",    messages);

        // 5. Call Groq
        String reply = callGroq(body);

        log.info("AI chat completed for user={} intents={}", userEmail, ctx.intentsAsString());
        return new AiChatResponse(reply, ctx.intentsAsString());
    }

    // ── Groq HTTP call ───────────────────────────────────────────────────────

    private String callGroq(ObjectNode requestBody) {
        try {
            String json = objectMapper.writeValueAsString(requestBody);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(groqApiUrl))
                    .header("Content-Type",  "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response =
                    httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Groq API error status={} body={}", response.statusCode(), response.body());
                return "I'm having trouble reaching the AI service right now. Please try again shortly.";
            }

            JsonNode root    = objectMapper.readTree(response.body());
            JsonNode choices = root.path("choices");

            if (choices.isEmpty()) {
                log.warn("Groq returned empty choices for body={}", response.body());
                return "I could not generate a response. Please try again.";
            }

            return choices.get(0).path("message").path("content").asText("").strip();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Groq call interrupted", e);
            return "The request was interrupted. Please try again.";
        } catch (Exception e) {
            log.error("Groq call failed: {}", e.getMessage(), e);
            return "I'm unable to reach the AI service right now. Please check your connection and try again.";
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void addMessage(ArrayNode messages, String role, String content) {
        ObjectNode msg = objectMapper.createObjectNode();
        msg.put("role",    role);
        msg.put("content", content);
        messages.add(msg);
    }

    /** Only allow "user" or "assistant" roles in history to prevent prompt injection. */
    private String sanitizeRole(String role) {
        if (role == null) return "user";
        return switch (role.toLowerCase()) {
            case "assistant" -> "assistant";
            default          -> "user";
        };
    }

    /** Strip null and trim to prevent prompt injection via oversized content. */
    private String sanitize(String text) {
        if (text == null) return "";
        // Truncate individual history turns to 500 chars
        String trimmed = text.strip();
        return trimmed.length() > 500 ? trimmed.substring(0, 500) : trimmed;
    }
}