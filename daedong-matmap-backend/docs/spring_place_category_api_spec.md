# 대동맛지도 Spring Boot 설계 문서 1

## 문서 목적
이 문서는 **Spring Boot를 처음 사용하는 입장**에서, 대동맛지도 프로젝트의 백엔드 설계를 기록하기 위한 1차 설계 문서이다.

이번 문서에서는 아래 두 가지를 먼저 확정한다.

1. `Place`, `Category` 엔티티 설계
2. **근처 밥집 조회 API** 명세

이 문서는 단순 코드 초안이 아니라, **왜 이렇게 설계하는지**를 이해하고 README 또는 개인 설계 문서로 남기기 위한 문서다.

---

## 이번 단계에서 해결하려는 문제
현재 프론트엔드에서 구현된 기능은 **현재 위치 불러오기**이다. 다음 단계로는 사용자의 현재 위치를 기준으로 반경 1km 안의 밥집을 조회해 리스트로 보여주는 백엔드 기능이 필요하다 [cite:1].

이 기능을 제대로 만들려면 단순히 API 하나를 만드는 것보다 먼저 아래를 정해야 한다.

- 음식점 데이터를 어떤 구조로 저장할지
- 카테고리를 문자열로 둘지 별도 테이블로 분리할지
- 외부 Kakao API 데이터와 앱 내부 데이터를 어떤 기준으로 관리할지
- 프론트엔드가 쓰기 좋은 응답 형식을 어떻게 설계할지

Spring Boot에서는 이런 기준을 **Entity → Repository → Service → Controller → DTO** 흐름으로 나눠 설계하는 것이 일반적이다 [web:51]. 또한 JPA 기반 프로젝트에서는 엔티티를 DB 테이블과 연결하는 핵심 모델로 두고, API 응답에는 엔티티를 직접 노출하지 않고 DTO를 별도로 두는 방식이 유지보수에 유리하다 [web:46][web:52].

---

## 왜 Entity를 먼저 설계하는가
Spring Boot에서 JPA를 사용할 때 Entity는 데이터베이스 테이블과 1:1에 가깝게 매핑되는 객체다 [web:51]. 즉, 엔티티 설계가 먼저 흔들리면 그 위에 올라가는 Repository, Service, API 응답 구조도 계속 흔들리게 된다.

이번 프로젝트에서 `Place`와 `Category`를 먼저 설계해야 하는 이유는 다음과 같다.

- `Place`는 맛집/카페를 담는 핵심 테이블이다 [cite:1].
- `Category`는 한식, 양식, 중식, 일식 같은 분류와 세부 검색 구조를 담당한다 [cite:1].
- 근처 밥집 조회 API는 결국 “현재 위치 기준 + 음식점 카테고리 필터 + 거리순 정렬” 문제이므로, 장소와 카테고리 구조가 먼저 확정되어야 한다.

즉, 이번 단계는 단순 조회 API 하나를 만드는 작업이 아니라, **앞으로 2번 기능(근처 카페), 3번 기능(카테고리 검색), 4번 기능(상세 모달)**까지 연결되는 기반 테이블을 만드는 작업이다 [cite:1].

---

## 설계 방향
이번 프로젝트는 포트폴리오용 백엔드 프로젝트이므로, 단순히 빠르게 만드는 것보다 **확장 가능한 구조**를 선택하는 것이 더 중요하다 [cite:21].

설계 방향은 다음과 같이 잡는다.

1. `Place`는 음식점과 카페를 모두 담을 수 있는 공통 엔티티로 설계한다 [cite:1].
2. `Category`는 문자열 필드 하나로 끝내지 않고 테이블로 분리한다 [cite:1].
3. 외부 API에서 온 데이터인지, 내부에서 생성된 데이터인지 구분할 수 있도록 `source`를 둔다 [cite:1].
4. 상태값은 enum으로 관리하되, DB에는 문자열로 저장한다. JPA/Hibernate에서는 enum을 `ORDINAL`보다 `STRING`으로 저장하는 편이 변경에 안전하다 [web:50].
5. API 응답은 Entity를 직접 반환하지 않고 DTO로 분리한다 [web:46][web:52].
6. 입력 검증은 DTO에서 `@Valid` 기반으로 처리한다. Spring Boot에서는 `@Valid`와 validation annotation 조합이 표준적인 방식이다 [web:49][web:55].

---

## Place 엔티티 설계

### Place의 역할
`Place`는 앱에서 보여줄 모든 장소의 기준 테이블이다. 현재는 밥집과 카페가 주 대상이지만, 구조를 잘 잡아두면 이후 디저트, 술집, 편의시설까지도 확장할 수 있다.

또한 외부 Kakao API에서 불러온 데이터와 사용자 제보로 들어온 데이터를 하나의 기준 구조 안에서 관리해야 하므로, 단순히 이름과 주소만 저장해서는 부족하다 [cite:1].

### Place 필드 제안

| 필드명 | 타입 | 설명 | 필요한 이유 |
|---|---|---|---|
| `id` | `Long` | 내부 PK | 모든 테이블의 기준 식별자 |
| `kakaoPlaceId` | `String` | 카카오 장소 ID | 외부 API 데이터와 중복 매칭용 |
| `category` | `Category` | 장소 카테고리 | 음식점/카페/세부 장르 분류 |
| `name` | `String` | 장소명 | 리스트/상세 표시 |
| `placeType` | `PlaceType` enum | RESTAURANT, CAFE | 1번/2번 기능 분기용 |
| `roadAddress` | `String` | 도로명 주소 | 사용자 표시용 |
| `jibunAddress` | `String` | 지번 주소 | 카카오 원본 보존 |
| `latitude` | `BigDecimal` | 위도 | 위치 계산 |
| `longitude` | `BigDecimal` | 경도 | 위치 계산 |
| `phone` | `String` | 전화번호 | 상세 정보용 |
| `source` | `PlaceSource` enum | KAKAO, USER, ADMIN | 데이터 출처 구분 |
| `status` | `PlaceStatus` enum | ACTIVE, CLOSED, PENDING | 노출 여부 관리 |
| `createdAt` | `LocalDateTime` | 생성 시각 | 운영 추적 |
| `updatedAt` | `LocalDateTime` | 수정 시각 | 운영 추적 |

### 왜 이렇게 나누는가

#### 1. `placeType`를 별도 enum으로 둔다
`Category`가 있는데 왜 `placeType`이 또 필요한지 헷갈릴 수 있다. 이유는 **조회 조건과 검색 분류가 서로 다르기 때문**이다.

예를 들어:
- `placeType = RESTAURANT` 는 “밥집인지 아닌지” 같은 큰 분류다.
- `category = 한식/중식/떡볶이` 는 세부 장르다.

즉, 1번 기능의 “근처 밥집 조회”는 `placeType = RESTAURANT` 필터가 핵심이고 [cite:1], 3번 기능의 “떡볶이 검색”은 `category` 검색이 핵심이다 [cite:1]. 둘을 분리하면 쿼리가 더 명확해진다.

#### 2. `kakaoPlaceId`를 둔다
외부 장소 API를 사용할 때 가장 흔한 문제 중 하나는 **중복 데이터**다. 같은 식당을 여러 번 저장하거나, 앱 내부 데이터와 외부 데이터가 충돌할 수 있다.

이때 `kakaoPlaceId`를 별도로 저장해두면, 외부 API에서 받아온 장소가 이미 내부 DB에 있는지 식별하기 쉬워진다 [cite:1]. 즉, 추후 캐싱 전략이나 중복 제거 로직에도 도움이 된다.

#### 3. `source`를 둔다
나중에는 사용자 제보로 추가된 가게도 생길 수 있다 [cite:1]. 따라서 모든 장소가 카카오 API에서 온다고 가정하면 확장성이 떨어진다.

예를 들어:
- `KAKAO` : 외부 API로 수집된 장소
- `USER` : 사용자 제보 기반 장소
- `ADMIN` : 관리자가 직접 등록한 장소

이렇게 나누면 데이터 신뢰도, 관리자 승인 흐름, 품질 관리 로직을 붙이기 쉬워진다 [cite:1].

#### 4. `status`를 둔다
장소는 항상 활성 상태가 아니다. 제보 대기 중일 수도 있고, 폐업일 수도 있다 [cite:1].

예를 들어:
- `ACTIVE` : 현재 노출 가능
- `PENDING` : 검수 대기
- `CLOSED` : 폐업 또는 숨김

이 상태값을 두면 조회 API에서 `ACTIVE`만 필터링할 수 있어 운영이 쉬워진다.

#### 5. 좌표를 `BigDecimal`로 둔다
위도/경도는 거리 계산에 쓰이는 값이므로 `double`보다 정밀도 관리가 쉬운 `BigDecimal`을 고려할 수 있다. 실무에서는 GIS 타입으로 가는 경우도 많지만, 초기 JPA 설계 문서 단계에서는 `BigDecimal` 컬럼으로 시작해도 괜찮다.

장기적으로 PostgreSQL + PostGIS를 사용하면 반경 검색을 더 자연스럽게 처리할 수 있다 [web:34][web:37]. 하지만 처음 Spring Boot를 익히는 단계에서는 너무 빠르게 GIS 타입까지 넣기보다, **엔티티 구조는 단순하게 시작하고 검색 로직을 점진적으로 고도화**하는 편이 학습에도 유리하다.

---

## Category 엔티티 설계

### Category의 역할
`Category`는 장소를 분류하기 위한 기준 데이터다. 단순히 문자열 하나를 `Place`에 넣는 방식보다 별도 테이블로 분리하는 편이 이후 검색과 데이터 정합성에 유리하다 [cite:1].

### Category 필드 제안

| 필드명 | 타입 | 설명 | 필요한 이유 |
|---|---|---|---|
| `id` | `Long` | 내부 PK | 카테고리 식별 |
| `majorType` | `String` | 한식/양식/중식/일식/카페 | 대분류 |
| `subType` | `String` | 닭/돼지/소/떡볶이 등 | 세부 분류 |
| `displayName` | `String` | 사용자 표시명 | 프론트 표시용 |
| `createdAt` | `LocalDateTime` | 생성 시각 | 운영 추적 |

### 왜 테이블로 분리하는가

#### 1. 문자열 오염을 막기 위해서
예를 들어 `Place`에 `categoryName = "한식"` 같은 문자열만 넣어두면, 나중에 아래 같은 문제가 생긴다.

- "한식"
- "한국음식"
- "한 식"
- "Korean"

이렇게 표현이 섞이면 검색 품질이 떨어지고 정렬이나 통계도 어려워진다. 별도 `Category` 테이블을 두면 기준값을 통제할 수 있다.

#### 2. 카테고리 검색 기능을 위해서
3번 기능은 사용자가 한식/양식/중식/일식 또는 닭, 돼지, 소, 떡볶이 같은 키워드로 검색하는 기능이다 [cite:1]. 이때 카테고리가 구조화되어 있으면 검색 매핑을 만들기 쉬워진다.

예를 들어:
- 대분류: `한식`
- 세부 분류: `돼지`
- 표시명: `돼지고기`

이런 구조는 UI 필터, 추천, 인기 카테고리 집계에도 유리하다.

#### 3. Place 엔티티가 가벼워진다
모든 카테고리 정보를 문자열 여러 개로 `Place`에 반복 저장하면 중복이 많아진다. 반면 `ManyToOne`으로 `Category`를 참조하면 정규화 측면에서 더 깔끔하다 [cite:22].

---

## 엔티티 관계
현재 단계에서는 아래 관계로 시작한다.

- `Category 1 : N Place`

즉, 하나의 카테고리에 여러 장소가 속할 수 있다. 따라서 `Place`에서 `Category`를 `@ManyToOne`으로 참조하는 구조가 적절하다.

이 구조가 좋은 이유는 다음과 같다.

- 장소는 하나의 대표 카테고리를 가진다고 보기 쉽다.
- 조회 쿼리가 단순하다.
- 초기에 너무 복잡한 다대다 구조를 피할 수 있다.

나중에 한 장소에 여러 태그를 붙이고 싶다면 `PlaceTag` 같은 별도 테이블을 추가하면 된다. 지금은 **가장 단순한 구조로 시작하는 것**이 학습과 구현 모두에 유리하다.

---

## 추천 enum 설계
Spring Boot + JPA에서는 상태성 값은 enum으로 관리하는 것이 읽기 쉽고 안전하다. 다만 DB에는 숫자 순서가 아닌 문자열로 저장하는 것이 일반적으로 더 안전하다 [web:50].

### PlaceType
```java
public enum PlaceType {
    RESTAURANT,
    CAFE
}
```

### PlaceSource
```java
public enum PlaceSource {
    KAKAO,
    USER,
    ADMIN
}
```

### PlaceStatus
```java
public enum PlaceStatus {
    ACTIVE,
    PENDING,
    CLOSED
}
```

### 왜 `EnumType.STRING`을 쓰는가
만약 enum을 숫자 순서(ORDINAL)로 저장하면, 나중에 enum 순서를 바꾸거나 중간에 값을 추가했을 때 기존 데이터 의미가 깨질 수 있다 [web:50].

예를 들어:
- 기존: `RESTAURANT = 0`, `CAFE = 1`
- 나중에 `BAKERY`를 중간에 추가

이러면 기존 데이터가 잘못 해석될 가능성이 생긴다. 반면 문자열 저장은 DB에서 바로 읽기도 쉽고 변경에도 안전하다 [web:50].

---

## Place 엔티티 예시 코드

```java
@Entity
@Table(name = "places")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kakao_place_id", unique = true, length = 100)
    private String kakaoPlaceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "place_type", nullable = false, length = 30)
    private PlaceType placeType;

    @Column(name = "road_address", length = 255)
    private String roadAddress;

    @Column(name = "jibun_address", length = 255)
    private String jibunAddress;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(length = 30)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlaceSource source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlaceStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

### 코드 설명

#### 1. `@Entity`, `@Table`
`@Entity`는 이 클래스가 JPA 엔티티라는 뜻이고, `@Table(name = "places")`는 DB 테이블 이름을 명시한다 [web:51]. 이름을 명시해 두면 추후 테이블 명명 규칙을 일관되게 맞추기 쉽다.

#### 2. `@NoArgsConstructor(access = PROTECTED)`
JPA는 기본 생성자가 필요하다 [web:48]. 하지만 아무 곳에서나 무분별하게 객체를 생성하지 못하게 `PROTECTED`로 두는 방식이 많이 쓰인다.

#### 3. `FetchType.LAZY`
카테고리를 항상 즉시 가져올 필요는 없으므로 지연 로딩을 기본으로 둔다. 초보 단계에서는 잘 안 와닿을 수 있지만, 연관 객체를 무조건 즉시 가져오면 조회 성능과 쿼리 수가 예상보다 커질 수 있다 [web:46][web:57].

#### 4. `precision`, `scale`
위도/경도는 자릿수를 관리해야 하므로 `precision`, `scale`을 지정한다. 이는 DB 컬럼 정밀도를 문서화하는 의미도 있다.

---

## Category 엔티티 예시 코드

```java
@Entity
@Table(name = "categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "major_type", nullable = false, length = 50)
    private String majorType;

    @Column(name = "sub_type", length = 50)
    private String subType;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

### 왜 Category는 단순하게 시작하는가
처음부터 카테고리 계층 구조를 너무 복잡하게 만들면 Spring이 처음인 입장에서 설계와 쿼리 모두 부담이 커진다. 그래서 우선은 `majorType`, `subType`, `displayName` 정도로만 시작하는 것이 좋다.

이후 필요하면 아래처럼 확장할 수 있다.

- `isActive`
- `sortOrder`
- `iconUrl`
- `parentCategoryId`

즉, 지금은 검색과 분류에 필요한 최소 구조만 둔다.

---

## BaseEntity를 도입할지 여부
실무에서는 `createdAt`, `updatedAt` 같은 공통 필드를 `@MappedSuperclass`로 빼는 경우가 많다 [web:47]. 하지만 Spring이 처음이라면 처음부터 추상 베이스 클래스까지 도입하면 구조 이해가 어려워질 수 있다.

따라서 현재 단계에서는 두 가지 선택지가 있다.

### 선택지 A: 처음엔 각 엔티티에 직접 작성
장점:
- 코드 흐름이 눈에 더 잘 들어온다.
- 학습 초기에 이해하기 쉽다.

단점:
- 중복이 생긴다.

### 선택지 B: BaseTimeEntity로 분리
장점:
- 공통 필드 재사용이 가능하다.
- 엔티티 코드가 더 간결해진다.

단점:
- 추상 클래스, 상속, auditing 개념까지 함께 이해해야 한다.

**추천:** 처음 설계 문서와 첫 구현 단계에서는 직접 작성하고, 2~3개 엔티티가 생긴 뒤 `BaseTimeEntity`로 리팩토링하는 것이 학습상 더 좋다.

---

## 왜 API 응답에 Entity를 직접 쓰지 않는가
Spring Boot를 처음 쓸 때 자주 하는 실수 중 하나가, Repository에서 가져온 Entity를 그대로 Controller에서 반환하는 것이다. 하지만 이는 장기적으로 문제가 된다 [web:46][web:52].

이유는 다음과 같다.

1. 연관관계가 많아지면 원치 않는 필드까지 응답에 노출될 수 있다 [web:46][web:52].
2. LAZY 로딩과 직렬화 문제가 발생할 수 있다.
3. API 응답 형식을 프론트 요구사항에 맞게 다듬기 어렵다.
4. 엔티티 구조 변경이 API 스펙 변경으로 이어질 수 있다.

따라서 API 응답은 DTO로 분리한다.

---

## 근처 밥집 조회 API 설계

### 기능 목표
사용자의 현재 위치를 받아, 반경 1km 이내의 음식점을 조회하고 거리순으로 리스트를 반환한다 [cite:1].

### 엔드포인트
```http
GET /api/places/nearby/restaurants
```

### Query Parameters

| 파라미터 | 타입 | 필수 여부 | 설명 |
|---|---|---|---|
| `lat` | `BigDecimal` | 필수 | 사용자 현재 위도 |
| `lng` | `BigDecimal` | 필수 | 사용자 현재 경도 |
| `radius` | `Integer` | 선택 | 검색 반경(m), 기본값 1000 |
| `size` | `Integer` | 선택 | 최대 조회 개수, 기본값 20 |

### 왜 Query Parameter로 받는가
이 API는 “리소스 생성”이 아니라 “조회”이므로 GET이 적절하다 [web:29][web:31][web:36]. 위치 좌표와 반경은 조회 조건이므로 request body보다 query parameter로 받는 편이 REST 관점에서 자연스럽다 [web:31][web:36].

### 요청 예시
```http
GET /api/places/nearby/restaurants?lat=37.6202000&lng=127.0611000&radius=1000&size=20
```

---

## API 응답 DTO 설계

### PlaceNearbyResponse
```java
public record PlaceNearbyResponse(
        Long placeId,
        String name,
        String categoryName,
        String roadAddress,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer distanceMeters
) {}
```

### 왜 이렇게 단순하게 시작하는가
근처 밥집 목록 화면에서는 모든 정보가 필요하지 않다. 리스트에 필요한 최소 정보만 주는 것이 좋다 [web:52].

현재 단계에서 필요한 정보는 보통 다음 정도다.
- 장소 ID
- 장소명
- 카테고리명
- 주소
- 좌표
- 현재 위치 기준 거리

전화번호, 영업시간, 상세 리뷰 정보는 리스트 화면에서 필요하지 않으므로 빼는 편이 응답도 가볍고 책임도 분리된다. 이런 방식은 DTO를 목적별로 쪼개는 설계 원칙과도 맞는다 [web:46][web:52].

---

## API 응답 예시

```json
{
  "places": [
    {
      "placeId": 101,
      "name": "대동국밥",
      "categoryName": "한식",
      "roadAddress": "서울특별시 노원구 ...",
      "latitude": 37.6205123,
      "longitude": 127.0609231,
      "distanceMeters": 183
    },
    {
      "placeId": 102,
      "name": "청년제육",
      "categoryName": "돼지고기",
      "roadAddress": "서울특별시 노원구 ...",
      "latitude": 37.6198811,
      "longitude": 127.0621177,
      "distanceMeters": 274
    }
  ],
  "count": 2,
  "radius": 1000
}
```

### 래핑 응답을 두는 이유
리스트만 바로 반환해도 동작은 한다. 하지만 나중에 `count`, `radius`, `nextCursor`, `hasNext` 같은 메타 정보를 붙이기 위해서는 리스트를 감싼 응답 구조가 더 유연하다.

---

## API 응답 래퍼 예시

```java
public record NearbyRestaurantListResponse(
        List<PlaceNearbyResponse> places,
        int count,
        int radius
) {}
```

---

## 입력 검증 설계
Spring Boot에서는 입력값 검증을 DTO나 컨트롤러 파라미터에 붙이는 방식이 일반적이다 [web:49][web:55].

이번 API는 GET 요청이라 query parameter 검증이 필요하다.

예시:
- `lat`: 필수, 범위 -90 ~ 90
- `lng`: 필수, 범위 -180 ~ 180
- `radius`: 1 ~ 2000
- `size`: 1 ~ 50

### 예시 코드
```java
@Validated
@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;

    @GetMapping("/nearby/restaurants")
    public NearbyRestaurantListResponse getNearbyRestaurants(
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal lat,
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal lng,
            @RequestParam(defaultValue = "1000") @Min(1) @Max(2000) Integer radius,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) Integer size
    ) {
        return placeService.getNearbyRestaurants(lat, lng, radius, size);
    }
}
```

### 왜 검증을 초반부터 넣는가
초보 프로젝트에서는 검증을 나중으로 미루기 쉽다. 하지만 잘못된 좌표나 비정상적으로 큰 반경이 들어오면 검색 로직이 불안정해질 수 있다.

Spring에서는 `@Valid`, `@Validated`, `@Min`, `@Max`, `@DecimalMin` 같은 검증 어노테이션을 통해 비교적 간단하게 방어 코드를 넣을 수 있다 [web:49][web:55]. 이것은 포트폴리오에서도 좋은 신호가 된다.

---

## Service 계층 설계 이유
Spring Boot에서 Controller는 요청을 받고 응답을 반환하는 역할에 집중하고, 실제 비즈니스 로직은 Service에서 처리하는 구조가 일반적이다. 이렇게 분리하면 테스트와 유지보수가 쉬워진다 [web:29][web:31].

### Service가 할 일
1. 입력 좌표와 반경을 받는다.
2. `placeType = RESTAURANT`, `status = ACTIVE` 조건으로 장소를 찾는다.
3. 거리 계산을 수행한다.
4. 반경 1km 내 데이터만 필터링한다.
5. 거리순 정렬 후 size만큼 자른다.
6. DTO로 변환한다.

### 왜 Repository에서 모든 걸 끝내지 않는가
처음에는 Repository에 복잡한 쿼리를 한 번에 넣고 싶을 수 있다. 하지만 Spring/JPA에 익숙하지 않다면, 처음부터 모든 계산을 DB 쿼리에 몰아넣는 방식은 디버깅이 어렵다.

따라서 초반에는 다음 전략이 좋다.

- 1차: 범위를 넓게 조회
- 2차: Service에서 거리 계산 및 정렬
- 3차: 이후 성능 이슈가 생기면 PostGIS/Native Query로 고도화

이 방식은 처음 배우는 단계에서 구조를 이해하기 쉽고, 나중에 성능 최적화 포인트도 설명하기 좋다.

---

## Repository 초안

### 기본 개념
Repository는 DB 접근을 담당한다. Spring Data JPA에서는 인터페이스만 선언해도 기본 CRUD 메서드를 사용할 수 있다 [web:51].

### PlaceRepository 예시
```java
public interface PlaceRepository extends JpaRepository<Place, Long> {

    List<Place> findByPlaceTypeAndStatus(PlaceType placeType, PlaceStatus status);
}
```

### 왜 이렇게 단순하게 시작하는가
처음부터 JPQL, QueryDSL, Native Query를 동시에 들고 가면 복잡도가 급격히 올라간다. 지금은 Spring/JPA 흐름에 익숙해지는 것이 우선이므로, 기본 메서드 기반으로 시작하는 것이 적절하다.

이후 장소 수가 많아지면 아래 순서로 개선할 수 있다.

1. 좌표 범위 bounding box 조회
2. JPQL 커스텀 쿼리
3. PostGIS 기반 거리 쿼리

---

## 추천 패키지 구조

```text
src/main/java/com/daedongmap
 ┣ place
 ┃ ┣ controller
 ┃ ┣ service
 ┃ ┣ repository
 ┃ ┣ domain
 ┃ ┗ dto
 ┣ category
 ┃ ┣ domain
 ┃ ┗ repository
 ┗ global
   ┣ exception
   ┣ config
   ┗ common
```

### 왜 도메인별로 나누는가
Spring 초보는 `controller`, `service`, `repository`를 프로젝트 전체 공용 폴더로 분리하는 경우가 많다. 하지만 도메인 기준으로 묶는 방식이 기능 단위 파악이 더 쉽다.

예를 들어 `place` 폴더 안에 컨트롤러, 서비스, DTO, 리포지토리가 함께 있으면 “근처 밥집 조회 기능”의 흐름을 한 묶음으로 보기 쉽다. 포트폴리오에서도 구조 설명이 더 명확해진다.

---

## 현재 단계의 구현 범위
이번 문서 기준으로 실제 구현 범위는 아래까지를 권장한다.

### 구현 1차
- `Place`, `Category` 엔티티 생성
- enum 3종 생성 (`PlaceType`, `PlaceSource`, `PlaceStatus`)
- `PlaceRepository` 생성
- 근처 밥집 조회 Controller/Service/DTO 생성
- 테스트용 더미 데이터 10~20개 입력

### 아직 하지 않아도 되는 것
- 회원가입/로그인
- 사용자 리뷰
- 영업시간 상세
- 관리자 승인 기능
- 외부 Kakao API 실연동

즉, 지금은 “DB에 저장된 밥집 데이터를 현재 위치 기준으로 조회해서 반환”하는 흐름만 먼저 완성하면 된다.

---

## 지금 설계가 이후 기능과 연결되는 방식

### 2번 기능: 근처 카페 조회
`placeType = CAFE`만 바꾸면 거의 같은 구조로 재사용할 수 있다 [cite:1].

### 3번 기능: 카테고리 검색
`Category.majorType`, `Category.subType`, `displayName`을 기준으로 검색 로직을 확장할 수 있다 [cite:1].

### 4번 기능: 상세 모달
`Place`를 기준으로 `BusinessHour`, `Review`를 붙이면 된다 [cite:1].

즉, 지금의 `Place + Category` 설계는 이후 기능까지 고려한 최소 공통 기반이다.

---

## 최종 설계 결론
이번 단계에서는 다음과 같이 확정하는 것이 좋다.

1. `Place`는 음식점/카페를 함께 담는 공통 엔티티로 설계한다 [cite:1].
2. `Category`는 별도 테이블로 분리해 검색과 정합성을 확보한다 [cite:1].
3. `placeType`, `source`, `status`는 enum + `EnumType.STRING`으로 저장한다 [web:50].
4. API 응답은 엔티티가 아니라 DTO로 분리한다 [web:46][web:52].
5. 근처 밥집 조회 API는 `GET /api/places/nearby/restaurants`로 설계하고, 좌표와 반경은 query parameter로 받는다 [web:29][web:31][web:36].
6. 거리 계산 로직은 초기에 Service에서 처리하고, 이후 PostGIS로 고도화할 수 있게 열어둔다 [web:34][web:37].

이 설계는 Spring Boot를 처음 사용하는 입장에서도 구조를 이해하기 쉽고, 동시에 포트폴리오에서 “왜 이렇게 나눴는지”를 설명하기 좋은 형태다.
