// 사용자의 현재 위치, 반경, 개수를 받는 요청용 DTO

package com.daedongmat.dto.place;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;

public record NearbyRestaurantRequest(

    @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
    @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다.")

    @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
    @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다.")
    BigDecimal lng,

    @Min(value = 1, message = "반경은 1 이상이어야 합니다.")
    @Max(value = 2000, message = "반경은 2000 이하여야 합니다.")
    Integer radius,

    @Min(value = 1, message = "조회 개수는 1 이상이어야 합니다.")
    @Min(value = 50, message = "조회 개수는 50 이하여야 합니다.")
    Integer size
) {
}