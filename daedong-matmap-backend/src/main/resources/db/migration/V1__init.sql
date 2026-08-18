-- 대동맛지도 초기 스키마
-- Hibernate ddl-auto 대신 이 파일이 스키마의 기준이다.
-- 엔티티를 바꿀 때는 V2__xxx.sql 을 새로 추가한다. 이 파일은 수정하지 않는다.

-- 음식 대분류 / 세부 키워드 체계
CREATE TABLE categories (
    id           BIGSERIAL PRIMARY KEY,
    major_type   VARCHAR(50)  NOT NULL,
    sub_type     VARCHAR(50),
    display_name VARCHAR(100) NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 장소 기준 테이블 (카카오 원천 데이터 + 앱 내부 데이터)
CREATE TABLE places (
    id             BIGSERIAL PRIMARY KEY,
    kakao_place_id VARCHAR(100) UNIQUE,
    category_id    BIGINT REFERENCES categories (id),
    name           VARCHAR(100)   NOT NULL,
    place_type     VARCHAR(30)    NOT NULL,
    road_address   VARCHAR(255),
    jibun_address  VARCHAR(255),
    latitude       NUMERIC(10, 7) NOT NULL,
    longitude      NUMERIC(10, 7) NOT NULL,
    phone          VARCHAR(30),
    source         VARCHAR(20)    NOT NULL,
    status         VARCHAR(20)    NOT NULL,
    created_at     TIMESTAMP      NOT NULL,
    updated_at     TIMESTAMP      NOT NULL,
    CONSTRAINT places_place_type_check CHECK (place_type IN ('RESTAURANT', 'CAFE', 'BAR', 'BAKERY', 'ETC')),
    CONSTRAINT places_source_check CHECK (source IN ('KAKAO', 'NAVER', 'GOOGLE', 'MANUAL')),
    CONSTRAINT places_status_check CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED', 'PENDING'))
);

-- 좌표 기반 조회용. 반경 검색이 본격화되면 PostGIS 인덱스로 교체를 검토한다.
CREATE INDEX idx_places_coords ON places (latitude, longitude);
CREATE INDEX idx_places_place_type_status ON places (place_type, status);

-- 가게 메뉴. 카카오 API가 메뉴를 주지 않으므로 관리자 입력 / 사용자 제보로 채운다.
CREATE TABLE menus (
    id           BIGSERIAL PRIMARY KEY,
    place_id     BIGINT       NOT NULL REFERENCES places (id) ON DELETE CASCADE,
    name         VARCHAR(100) NOT NULL,
    price        INTEGER,
    is_signature BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order   INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL
);

CREATE INDEX idx_menus_place ON menus (place_id);

-- 앱 내부 사용자 리뷰.
-- 회원 테이블 없이 user_key(앱인토스 익명 해시)로 작성자를 식별한다.
CREATE TABLE reviews (
    id         BIGSERIAL PRIMARY KEY,
    place_id   BIGINT       NOT NULL REFERENCES places (id) ON DELETE CASCADE,
    user_key   VARCHAR(100) NOT NULL,
    rating     INTEGER      NOT NULL,
    content    TEXT,
    created_at TIMESTAMP    NOT NULL,
    updated_at TIMESTAMP    NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5),
    -- 한 사용자는 한 장소에 리뷰 하나. 다시 쓰면 수정된다.
    CONSTRAINT uk_reviews_place_user UNIQUE (place_id, user_key)
);

CREATE INDEX idx_reviews_place_created ON reviews (place_id, created_at DESC);
