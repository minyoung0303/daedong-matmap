package com.daedongmat.place.dto;

import com.daedongmat.entity.Menu;

/** 상세 시트에 보여줄 메뉴 한 줄. */
public record MenuResponse(
    Long id,
    String name,
    Integer price,
    boolean signature
) {
    public static MenuResponse from(Menu menu) {
        return new MenuResponse(menu.getId(), menu.getName(), menu.getPrice(), menu.isSignature());
    }
}
