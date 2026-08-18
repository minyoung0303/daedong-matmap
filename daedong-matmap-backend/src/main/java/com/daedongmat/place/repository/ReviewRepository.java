package com.daedongmat.place.repository;

import com.daedongmat.place.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** 장소의 리뷰를 최신순으로 가져온다. */
    List<Review> findByPlaceIdOrderByCreatedAtDesc(Long placeId);

    /** 같은 사용자가 이미 쓴 리뷰가 있는지 확인한다. (있으면 수정) */
    Optional<Review> findByPlaceIdAndUserKey(Long placeId, String userKey);
}
