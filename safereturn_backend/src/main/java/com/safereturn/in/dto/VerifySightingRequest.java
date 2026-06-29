package com.safereturn.in.dto;

public record VerifySightingRequest(
    String action, // "CONFIRM" or "NOT_FOUND"
    boolean provideReward, // whether the reporter gets the reward
    Long rewardAmount // amount to reward (defaults to the report's reward or custom amount)
) {}
