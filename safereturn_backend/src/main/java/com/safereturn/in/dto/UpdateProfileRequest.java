// package com.safereturn.in.dto;

// import jakarta.validation.constraints.Email;
// import jakarta.validation.constraints.Pattern;
// import jakarta.validation.constraints.Size;

// /**
//  * Request body for PUT /api/profile.
//  *
//  * All fields are optional — only non-null, non-blank values are applied.
//  * The phone field is intentionally absent: it cannot be changed.
//  */
// public record UpdateProfileRequest(

//     @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters.")
//     String fullName,

//     @Email(message = "Please enter a valid email address.")
//     @Size(max = 150, message = "Email must not exceed 150 characters.")
//     String email,

//     @Size(max = 500, message = "Address must not exceed 500 characters.")
//     String address,

//     @Size(max = 100, message = "City must not exceed 100 characters.")
//     String city,

//     @Size(max = 100, message = "State must not exceed 100 characters.")
//     String state,

//     @Size(max = 100, message = "Country must not exceed 100 characters.")
//     String country,

//     @Size(max = 100, message = "Emergency contact name must not exceed 100 characters.")
//     String emergencyContactName,

//     @Pattern(
//         regexp = "^[+]?[0-9\\s\\-]{7,15}$|^$",
//         message = "Emergency contact number must be a valid phone number."
//     )
//     String emergencyContactNumber

// ) {
//     /**
//      * Returns null-safe trimmed value, or null if blank/null.
//      * Used by the service so that empty strings don't overwrite existing data.
//      */
//     public static String sanitize(String value) {
//         if (value == null) return null;
//         String trimmed = value.trim();
//         return trimmed.isEmpty() ? null : trimmed;
//     }
// }





package com.safereturn.in.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for PUT /api/profile.
 *
 * All fields are optional — only non-null, non-blank values are applied.
 * The phone field is intentionally absent: it cannot be changed.
 */
public record UpdateProfileRequest(

    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters.")
    String fullName,

    @Email(message = "Please enter a valid email address.")
    @Size(max = 150, message = "Email must not exceed 150 characters.")
    String email,

    @Size(max = 500, message = "Address must not exceed 500 characters.")
    String address,

    @Size(max = 100, message = "City must not exceed 100 characters.")
    String city,

    @Size(max = 100, message = "State must not exceed 100 characters.")
    String state,

    @Size(max = 100, message = "Country must not exceed 100 characters.")
    String country,

    @Size(max = 100, message = "Emergency contact name must not exceed 100 characters.")
    String emergencyContactName,

    @Pattern(
        regexp = "^[+]?[0-9\\s\\-]{7,15}$|^$",
        message = "Emergency contact number must be a valid phone number."
    )
    String emergencyContactNumber

) {
    /**
     * Returns null-safe trimmed value, or null if blank/null.
     * Used by the service so that empty strings don't overwrite existing data.
     */
    public static String sanitize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}