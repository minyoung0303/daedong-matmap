package com.daedongmat.place.controller;

import com.daedongmat.place.dto.NearbyRestaurantListResponse;
import com.daedongmat.place.dto.NearbyRestaurantRequest;
import com.daedongmat.place.service.PlaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// REST API 요청을 처리하는 클래스(반환 값은 JSON으로 응답)
@RestController
// 컨트롤러가 처리하는 URL의 공통 시작경로
@RequestMapping("/api/places")
// final 필드에 대한 생성자를 Lombok이 자동 생성함.
// Spring에서는 생성자 주입이 권장되며, 이를 간결하게 표현한다.
@RequiredArgsConstructor
public class PlaceController {
    // Controller가 직접 DB를 만지지 않고, Service에게 일을 위임하기 위해 필요한 의존성
    // 이 의존성을 Spring이 자동으로 주입한다.
    private final PlaceService placeService;

    // HTTP GET 요청중 /api/places/nearby/restaurants 경로를 이 함수가 처리
    @GetMapping("/nearby/restaurants")
    public NearbyRestaurantListResponse getNearbyRestaurants(
        // GET 요청의 query parameter을 DTO 객체에 자동으로 묶어준다.
        // 예를 들어 lat= ... &lng=.. 같은 값이 NearbyRestaurantRequest에 들어간다.
        @Valid @ModelAttribute NearbyRestaurantRequest request
        // @Valid: DTO에 작성한 검증 조건을 활성화함.
        // 잘못된 좌표나 비정상 반경 값이 들어오면 자동으로 검증할 수 있음
    ) {
        // Controller는 직접 계산하지 않음. 받은 요청을 Service에 넘기고, Service 결과를 그대로 반환함.
        return placeService.findNearbyRestaurants(request);
    }
}