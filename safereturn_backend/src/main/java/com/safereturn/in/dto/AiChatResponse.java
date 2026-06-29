package com.safereturn.in.dto;

/**
 * Response body for POST /api/ai/chat
 *
 * <pre>
 * {
 *   "reply": "You currently have 3 unresolved missing person reports.",
 *   "contextUsed": "REPORTS,DASHBOARD"
 * }
 * </pre>
 *
 * contextUsed — comma-separated list of data sources that were injected
 *               into the prompt. Useful for debugging; can be hidden in
 *               production UI.
 */
public record AiChatResponse(String reply, String contextUsed) {}