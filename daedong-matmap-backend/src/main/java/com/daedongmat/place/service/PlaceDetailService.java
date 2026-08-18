package com.daedongmat.place.service;

import com.daedongmat.place.entity.Menu;
import com.daedongmat.place.entity.Place;
import com.daedongmat.place.entity.PlaceSource;
import com.daedongmat.place.entity.PlaceStatus;
import com.daedongmat.place.entity.PlaceType;
import com.daedongmat.place.entity.Review;
import com.daedongmat.place.dto.KakaoPlacePayload;
import com.daedongmat.place.dto.MenuResponse;
import com.daedongmat.place.dto.PlaceDetailResponse;
import com.daedongmat.place.dto.ReviewResponse;
import com.daedongmat.place.dto.ReviewUpsertRequest;
import com.daedongmat.place.repository.MenuRepository;
import com.daedongmat.place.repository.PlaceRepository;
import com.daedongmat.place.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 가게 상세(메뉴 + 별점 + 리뷰)를 담당하는 서비스.
 *
 * 핵심 아이디어는 "필요할 때만 장소를 저장한다"이다.
 * 사용자가 둘러보는 장소를 전부 DB에 넣으면 쓸모없는 행이 계속 쌓인다.
 * 그래서 조회는 읽기만 하고, 리뷰를 남기는 순간에 그 장소를 만든다.
 */
@Service
@RequiredArgsConstructor
public class PlaceDetailService {

    private final PlaceRepository placeRepository;
    private final ReviewRepository reviewRepository;
    private final MenuRepository menuRepository;

    /**
     * 카카오 장소 ID로 상세를 조회한다.
     * 아직 저장된 적 없는 장소면 빈 상세를 돌려준다. (예외를 던지지 않는다)
     */
    @Transactional(readOnly = true)
    public PlaceDetailResponse getDetail(String kakaoPlaceId, String userKey) {
        return placeRepository.findByKakaoPlaceId(kakaoPlaceId)
            .map(place -> toDetail(place, userKey))
            .orElseGet(() -> PlaceDetailResponse.empty(kakaoPlaceId));
    }

    /**
     * 리뷰를 새로 쓰거나 이미 쓴 리뷰를 수정한다.
     * 장소가 없으면 요청에 담겨 온 카카오 정보로 먼저 만든다.
     */
    @Transactional
    public PlaceDetailResponse upsertReview(String kakaoPlaceId, String userKey, ReviewUpsertRequest request) {
        Place place = placeRepository.findByKakaoPlaceId(kakaoPlaceId)
            .orElseGet(() -> placeRepository.save(toPlace(kakaoPlaceId, request.place())));

        Review review = reviewRepository.findByPlaceIdAndUserKey(place.getId(), userKey)
            .orElseGet(() -> Review.builder()
                .place(place)
                .userKey(userKey)
                .build());

        review.setRating(request.rating());
        review.setContent(normalizeContent(request.content()));

        reviewRepository.save(review);

        return toDetail(place, userKey);
    }

    /** 내가 쓴 리뷰를 삭제한다. 남의 리뷰는 지울 수 없다. */
    @Transactional
    public PlaceDetailResponse deleteMyReview(String kakaoPlaceId, String userKey) {
        Optional<Place> found = placeRepository.findByKakaoPlaceId(kakaoPlaceId);

        if (found.isEmpty()) {
            return PlaceDetailResponse.empty(kakaoPlaceId);
        }

        Place place = found.get();

        reviewRepository.findByPlaceIdAndUserKey(place.getId(), userKey)
            .ifPresent(reviewRepository::delete);

        return toDetail(place, userKey);
    }

    // --- 내부 변환 ---

    private PlaceDetailResponse toDetail(Place place, String userKey) {
        List<Review> reviews = reviewRepository.findByPlaceIdOrderByCreatedAtDesc(place.getId());
        List<Menu> menus = menuRepository.findByPlaceIdOrderBySignatureDescSortOrderAsc(place.getId());

        List<ReviewResponse> reviewResponses = reviews.stream()
            .map(review -> ReviewResponse.of(review, userKey))
            .toList();

        ReviewResponse myReview = reviewResponses.stream()
            .filter(ReviewResponse::mine)
            .findFirst()
            .orElse(null);

        return new PlaceDetailResponse(
            place.getId(),
            place.getKakaoPlaceId(),
            true,
            averageRating(reviews),
            reviews.size(),
            menus.stream().map(MenuResponse::from).toList(),
            reviewResponses,
            myReview
        );
    }

    /**
     * 평균 별점을 소수 첫째 자리까지 계산한다.
     *
     * 리뷰 수가 많아지면 places 테이블에 avg_rating / review_count를 비정규화해서
     * 매번 다 읽지 않도록 바꾸는 게 좋다. 지금은 장소 하나당 리뷰가 적어서 그대로 계산한다.
     */
    private double averageRating(List<Review> reviews) {
        if (reviews.isEmpty()) {
            return 0.0;
        }

        double sum = reviews.stream().mapToInt(Review::getRating).sum();
        return Math.round((sum / reviews.size()) * 10.0) / 10.0;
    }

    private String normalizeContent(String content) {
        if (content == null) {
            return null;
        }

        String trimmed = content.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** 카카오에서 받은 정보로 Place 엔티티를 만든다. */
    private Place toPlace(String kakaoPlaceId, KakaoPlacePayload payload) {
        return Place.builder()
            .kakaoPlaceId(kakaoPlaceId)
            .name(payload.name())
            .placeType(resolvePlaceType(payload.categoryPath()))
            .roadAddress(payload.roadAddress())
            .jibunAddress(payload.jibunAddress())
            .phone(payload.phone())
            .latitude(payload.latitude())
            .longitude(payload.longitude())
            .source(PlaceSource.KAKAO)
            .status(PlaceStatus.ACTIVE)
            .build();
    }

    /**
     * 카카오 카테고리 경로("음식점 > 한식 > 국밥")를 우리 PlaceType으로 매핑한다.
     * 프론트가 보낸 값을 그대로 믿지 않고 서버에서 판단한다.
     */
    private PlaceType resolvePlaceType(String categoryPath) {
        if (categoryPath == null || categoryPath.isBlank()) {
            return PlaceType.ETC;
        }

        if (categoryPath.contains("베이커리") || categoryPath.contains("제과")) {
            return PlaceType.BAKERY;
        }

        if (categoryPath.contains("술집") || categoryPath.contains("호프") || categoryPath.contains("주점")) {
            return PlaceType.BAR;
        }

        if (categoryPath.contains("카페") || categoryPath.contains("디저트")) {
            return PlaceType.CAFE;
        }

        if (categoryPath.contains("음식점")) {
            return PlaceType.RESTAURANT;
        }

        return PlaceType.ETC;
    }
}
