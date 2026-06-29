// // package com.safereturn.in.dto;

// // import java.time.LocalDateTime;

// // public record UserDto(
// //     Long id,
// //     String fullName,
// //     String email,
// //     String phone,
// //     String role,
// //     boolean phoneVerified,
// //     boolean emailVerified,
// //     LocalDateTime createdAt,
// //     LocalDateTime lastLogin
// // ) {}













// package com.safereturn.in.dto;

// import java.time.LocalDateTime;

// /**
//  * Read-only projection returned by GET /api/profile and all auth endpoints.
//  * Never exposes the password hash or any internal security fields.
//  */
// public record UserDto(
//     Long             id,
//     String           fullName,
//     String           email,
//     String           phone,
//     String           role,
//     boolean          phoneVerified,
//     boolean          emailVerified,
//     // Profile fields — may be null until the user fills them in
//     String           address,
//     String           city,
//     String           state,
//     String           country,
//     String           emergencyContactName,
//     String           emergencyContactNumber,
//     LocalDateTime    createdAt,
//     LocalDateTime    lastLogin
// ) {}















package com.safereturn.in.dto;

import java.time.LocalDateTime;

/**
 * Read-only projection returned by GET /api/profile and all auth endpoints.
 * Never exposes the password hash or any internal security fields.
 */
public record UserDto(
    Long             id,
    String           fullName,
    String           email,
    String           phone,
    String           role,
    boolean          phoneVerified,
    boolean          emailVerified,
    // Profile fields — may be null until the user fills them in
    String           address,
    String           city,
    String           state,
    String           country,
    String           emergencyContactName,
    String           emergencyContactNumber,
    LocalDateTime    createdAt,
    LocalDateTime    lastLogin
) {}