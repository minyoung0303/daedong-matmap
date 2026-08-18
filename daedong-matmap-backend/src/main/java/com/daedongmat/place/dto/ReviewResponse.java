package com.daedongmat.place.dto;

import com.daedongmat.entity.Review;

import java.time.LocalDateTime;

/**
 * 상세 시트에 보여줄 리뷰 한 건.
 *
 * userKey는 개인 식별자이므로 응답에 그대로 담지 않는다.
 * 대신 "내가 쓴 리뷰인지"(mine)와 표시용 익명 이름(authorLabel)만 내려준다.
 */
public record ReviewResponse(
    Long id,
    Integer rating,
    String content,
    String authorLabel,
    boolean mine,
    LocalDateTime createdAt
) {
    public static ReviewResponse of(Review review, String requesterKey) {
        String userKey = review.getUserKey();
        boolean mine = requesterKey != null && requesterKey.equals(userKey);

        return new ReviewResponse(
            review.getId(),
            review.getRating(),
            review.getContent(),
            mine ? "내 리뷰" : toAnonymousLabel(userKey),
            mine,
            review.getCreatedAt()
        );
    }

    /** userKey를 그대로 노출하지 않기 위해 짧은 익명 라벨로 바꾼다. */
    private static String toAnonymousLabel(String userKey) {
        if (userKey == null || userKey.isBlank()) {
            return "익명";
        }

        int suffix = Math.abs(userKey.hashCode() % 10000);
        return "익명" + suffix;
    }
}
