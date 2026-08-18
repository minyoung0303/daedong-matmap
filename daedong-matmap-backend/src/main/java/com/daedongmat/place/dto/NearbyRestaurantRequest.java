// 사용자의 현재 위치, 반경, 개수를 받는 요청용 DTO

// 위도 lat
// 경도 lng
// 반경 radius
// 최대 조회 수 size

// 필요한 이유
// : 파라미터를 각각 따로 받으면 간단하지만, 나중에 검색 조건이 늘어날 경우 Controller 메서드 인자가 너무 길어짐.
// 요청 DTO로 묶어두면 API 입력 구조가 명확해지고, 검증도 한 곳에 모을 수 있음

package com.daedongmat.place.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record NearbyRestaurantRequest(

    // 위도 검증이 lng 필드에 붙어 있어서 경도가 -90~90으로 제한되고 있었다.
    // lat 필드 자체가 없어서 위도를 아예 받을 수 없었던 것도 함께 고쳤다.
    @NotNull(message = "위도는 필수입니다.")
    @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
    @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다.")
    BigDecimal lat,

    @NotNull(message = "경도는 필수입니다.")
    @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
    @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다.")
    BigDecimal lng,

    @Min(value = 1, message = "반경은 1 이상이어야 합니다.")
    @Max(value = 2000, message = "반경은 2000 이하여야 합니다.")
    Integer radius,

    // 두 번째 애노테이션이 @Min이라 "50 이상"이 되어 있었다. @Max가 맞다.
    @Min(value = 1, message = "조회 개수는 1 이상이어야 합니다.")
    @Max(value = 50, message = "조회 개수는 50 이하여야 합니다.")
    Integer size
) {
}