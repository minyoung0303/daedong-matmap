package com.daedongmat.place.repository;

import com.daedongmat.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuRepository extends JpaRepository<Menu, Long> {

    /** 대표 메뉴를 먼저, 그다음 지정한 순서대로 가져온다. */
    List<Menu> findByPlaceIdOrderBySignatureDescSortOrderAsc(Long placeId);
}
