package com.daedongmat.place.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * 프론트가 카카오에서 받은 장소 정보를 그대로 전달하는 DTO.
 *
 * 리뷰를 쓰려면 그 장소가 우리 DB에 있어야 한다. 하지만 사용자가 둘러보는 모든 장소를
 * 미리 저장해 둘 수는 없다. 그래서 리뷰를 실제로 남기는 순간에만 이 정보로 장소를 만든다.
 * (조회는 쓰기를 하지 않고, 아직 없는 장소는 빈 상세로 응답한다.)
 */
public record KakaoPlacePayload(

    @NotBlank(message = "장소 이름은 필수입니다.")
    @Size(max = 100, message = "장소 이름은 100자 이하여야 합니다.")
    String name,

    @Size(max = 255, message = "카테고리는 255자 이하여야 합니다.")
    String categoryPath,

    @Size(max = 255, message = "도로명 주소는 255자 이하여야 합니다.")
    String roadAddress,

    @Size(max = 255, message = "지번 주소는 255자 이하여야 합니다.")
    String jibunAddress,

    @Size(max = 30, message = "전화번호는 30자 이하여야 합니다.")
    String phone,

    @NotNull(message = "위도는 필수입니다.")
    @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
    @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다.")
    BigDecimal latitude,

    @NotNull(message = "경도는 필수입니다.")
    @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
    @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다.")
    BigDecimal longitude
) {
}
