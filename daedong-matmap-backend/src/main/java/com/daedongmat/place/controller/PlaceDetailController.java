package com.daedongmat.place.controller;

import com.daedongmat.place.dto.PlaceDetailResponse;
import com.daedongmat.place.dto.ReviewUpsertRequest;
import com.daedongmat.place.service.PlaceDetailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 가게 상세와 리뷰 API.
 *
 * 사용자 식별은 X-User-Key 헤더로 받는다.
 * URL이나 쿼리 스트링에 식별자를 넣으면 로그와 리퍼러에 남아서 헤더가 더 안전하다.
 */
@RestController
@RequestMapping("/api/places/kakao/{kakaoPlaceId}")
@RequiredArgsConstructor
public class PlaceDetailController {

    private static final String USER_KEY_HEADER = "X-User-Key";

    private final PlaceDetailService placeDetailService;

    /** 상세 조회. 아직 등록되지 않은 장소도 200으로 빈 상세를 돌려준다. */
    @GetMapping("/detail")
    public PlaceDetailResponse getDetail(
        @PathVariable String kakaoPlaceId,
        @RequestHeader(value = USER_KEY_HEADER, required = false) String userKey
    ) {
        return placeDetailService.getDetail(kakaoPlaceId, userKey);
    }

    /** 리뷰 작성 또는 수정. 한 사용자는 장소마다 리뷰 하나만 가진다. */
    @PutMapping("/reviews")
    public PlaceDetailResponse upsertReview(
        @PathVariable String kakaoPlaceId,
        @RequestHeader(USER_KEY_HEADER) String userKey,
        @Valid @RequestBody ReviewUpsertRequest request
    ) {
        return placeDetailService.upsertReview(kakaoPlaceId, userKey, request);
    }

    /** 내 리뷰 삭제. */
    @DeleteMapping("/reviews")
    public PlaceDetailResponse deleteMyReview(
        @PathVariable String kakaoPlaceId,
        @RequestHeader(USER_KEY_HEADER) String userKey
    ) {
        return placeDetailService.deleteMyReview(kakaoPlaceId, userKey);
    }
}
