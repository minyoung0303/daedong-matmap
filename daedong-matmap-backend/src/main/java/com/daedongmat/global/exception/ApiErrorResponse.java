package com.daedongmat.global.exception;

import java.util.List;

/** 프론트가 그대로 화면에 보여줄 수 있는 형태의 오류 응답. */
public record ApiErrorResponse(
    String message,
    List<String> details
) {
    public static ApiErrorResponse of(String message) {
        return new ApiErrorResponse(message, List.of());
    }

    public static ApiErrorResponse of(String message, List<String> details) {
        return new ApiErrorResponse(message, details);
    }
}
