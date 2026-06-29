package com.safereturn.in.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResendOtpRequest(

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^[1-9][0-9]{9}$",
        message = "Phone must be exactly 10 digits"
    )
    String phone

) {}