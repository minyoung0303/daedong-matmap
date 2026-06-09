// 여러 밥집 목록 + 개수 + 반경

package com.daedongmat.dto.place;

import java.util.List;

public record NearbyRestauantListResponse(
    // 밥집 목록
    List<PlaceNearbyResponse> places,
    // 실제 반환 개수
    int count,
    // 이번 조회에 사용한 반경
    int radius
){

}