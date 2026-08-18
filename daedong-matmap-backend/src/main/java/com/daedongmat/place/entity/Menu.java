package com.daedongmat.place.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 가게 메뉴.
 *
 * 카카오 로컬 API는 메뉴를 제공하지 않기 때문에 이 데이터는 외부에서 받아올 수 없다.
 * 관리자 입력이나 사용자 제보로 채우는 것을 전제로 한다.
 * 비어 있으면 상세 시트에서 "등록된 메뉴 없음"으로 표시하고 카카오맵 링크를 안내한다.
 */
@Entity
@Table(name = "menus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @Column(nullable = false, length = 100)
    private String name;

    /** 원 단위. 가격을 모르면 null로 둔다. */
    @Column
    private Integer price;

    /** 대표 메뉴 여부. 상세 시트에서 위쪽에 보여준다. */
    @Column(name = "is_signature", nullable = false)
    private boolean signature;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
