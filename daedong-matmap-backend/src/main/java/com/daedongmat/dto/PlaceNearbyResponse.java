// 밥집 한 개의 응답 정보를 담는 응답용 DTO
// Entity를 직접 API에 노출하지 않고, 
// 요청/응답 전용 DTO를 분리하는 방식이 일반적이며 유지보수에 편리함

// 1. 근처 밥집 조회 API의 응담 DTO
//      리스트화면에 필요한 값만 담는 얇은 응답 객체로 설계

// 응답 DTO는 consumer 친화적으로 단순하고 명시적이어야함.
// 계산된 값이나 표시용 필드를 담아도 됨

package com.daedongmat.dto.place;

import java.math.BigDecimal;

public record PlaceNearbyResponse(
        Long placeId,
        String name,
        String categoryName,
        String roadAddress,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer distanceMeters
) {
}
