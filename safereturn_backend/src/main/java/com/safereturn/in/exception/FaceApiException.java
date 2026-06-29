package com.safereturn.in.exception;

import lombok.Getter;

@Getter
public class FaceApiException extends RuntimeException {

    private final int httpStatus;

    public FaceApiException(String message, int httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
}