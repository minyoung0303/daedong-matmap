package com.daedongmat.global.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

/**
 * API 오류를 일정한 형태로 내려주는 핸들러.
 * 이게 없으면 검증 실패가 스프링 기본 오류 페이지 형태로 나가서 프론트가 메시지를 읽기 어렵다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** @Valid 검증 실패 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        List<String> details = exception.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .toList();

        return ResponseEntity
            .badRequest()
            .body(ApiErrorResponse.of("입력값을 확인해 주세요.", details));
    }

    /** X-User-Key 같은 필수 헤더가 빠진 경우 */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingHeader(MissingRequestHeaderException exception) {
        return ResponseEntity
            .badRequest()
            .body(ApiErrorResponse.of(exception.getHeaderName() + " 헤더가 필요합니다."));
    }

    /** 그 밖의 예상하지 못한 오류. 내부 메시지를 그대로 노출하지 않는다. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception) {
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiErrorResponse.of("요청을 처리하는 중 문제가 발생했습니다."));
    }
}
