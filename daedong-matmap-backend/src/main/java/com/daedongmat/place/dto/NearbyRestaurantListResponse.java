// 여러 밥집 목록 + 개수 + 반경
// List<PlaceNearbyResponse> 만 바로 반환해도 되지만, 
// 나중에 hasNext, netxCursor, timestamp 같은 메타 정보를 붙이고 싶어질 수 있으므로 래퍼 DTO가 확장에 더 유리하다.
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