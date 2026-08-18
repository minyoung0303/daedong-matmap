package com.daedongmat.place.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 리뷰 작성/수정 요청.
 * 작성자(userKey)는 본문이 아니라 X-User-Key 헤더로 받는다.
 */
public record ReviewUpsertRequest(

    @NotNull(message = "별점은 필수입니다.")
    @Min(value = 1, message = "별점은 1 이상이어야 합니다.")
    @Max(value = 5, message = "별점은 5 이하여야 합니다.")
    Integer rating,

    @Size(max = 1000, message = "리뷰는 1000자 이하로 작성해 주세요.")
    String content,

    /** 아직 DB에 없는 장소라면 이 정보로 새로 만든다. */
    @NotNull(message = "장소 정보는 필수입니다.")
    @Valid
    KakaoPlacePayload place
) {
}
