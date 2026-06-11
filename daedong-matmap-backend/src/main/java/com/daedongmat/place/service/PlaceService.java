package com.daedongmat.place.service;

import com.daedongmat.place.dto.NearbyRestaurantListResponse;
import com.daedongmat.place.dto.NearbyRestaurantRequest;
import com.daedongmat.place.dto.PlaceNearbyResponse;
import com.daedongmat.place.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

// 이 클래스가 비즈니스 로직을 담당하는 서비스 계층이라는 뜻.
// Spring이 Bean으로 등록해 Controller에서 주입받을 수 있다.
@Service
@RequiredArgsConstructor
public class PlaceService {
    
    private final PlaceRepository placeRepository;

    // findNearbyRestaurants() ; 실제 핵심 역할
    // 현재 단계에서는 아직 Repository와 DB를 붙이지 않았기 때문에 더미데이터를 직접 만들어 응답 DTO로 반환한다.
    // 이렇게 하면 Controller-Service 연결 부터 먼저 검증할 수 있다.

    // 순서는 아래와 같다.
    // (1) 요청 DTO 받기 -> (2) 기본 반경값 결정 -> (3) 응답 DTO 리스트 만들기 -> (4) 최종 래퍼 DTO 반환

    // 나중에는 이 함수 안에서 아래 작업이 추가 된다.
    // Repository 호출, placeType = RESTAURANT 필터, 거리 계산, 반경 1km 필터링, 거리순 정렬, DTO 변환
    public NearbyRestaurantListResponse findNearbyRestaurants(NearbyRestaurantRequest request) {
        int radius = request.radius() != null ? request.radius() : 1000;

        List<PlaceNearbyResponse> places = List.of(
            new PlaceNearbyResponse(
                1L,
                "대동국밥",
                "한식",
                "서울특별시 노원구 광운로 00",
                new BigDecimal("37.6205123"),
                new BigDecimal("127.0609231"),
                183
            ),

            new PlaceNearbyResponse(
                2L,
                "청년제육",
                "돼지고기",
                "서울특별시 노원구 월계로 00",
                new BigDecimal("37.6198811"),
                new BigDecimal("127.0621177"),
                274
            )
        );

        return new NearbyRestaurantListResponse(
            places,
            places.size(),
            radius
        );
    }
}