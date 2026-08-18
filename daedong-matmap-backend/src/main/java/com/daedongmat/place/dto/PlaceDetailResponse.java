package com.daedongmat.place.dto;

import java.util.List;

/**
 * 가게 상세 시트 응답.
 *
 * placeId가 null이면 아직 우리 DB에 없는 장소라는 뜻이다.
 * 이 경우 메뉴와 리뷰는 비어 있고, 프론트는 카카오에서 받은 기본 정보만 보여준다.
 * 404가 아니라 200 + 빈 상태로 응답해서 프론트 분기를 단순하게 만든다.
 */
public record PlaceDetailResponse(
    Long placeId,
    String kakaoPlaceId,
    boolean registered,
    double ratingAverage,
    int ratingCount,
    List<MenuResponse> menus,
    List<ReviewResponse> reviews,
    ReviewResponse myReview
) {

    /** DB에 아직 없는 장소용 빈 응답 */
    public static PlaceDetailResponse empty(String kakaoPlaceId) {
        return new PlaceDetailResponse(null, kakaoPlaceId, false, 0.0, 0, List.of(), List.of(), null);
    }
}
