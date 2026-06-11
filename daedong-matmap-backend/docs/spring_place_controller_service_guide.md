# 대동맛지도 Spring Boot 설계 문서 2

## 문서 목표
이 문서는 Spring Boot를 처음 사용하는 입장에서, **PlaceController의 GET 함수 1개**와 **PlaceService의 함수 1개**를 어디에 만들고 어떻게 연결하는 것이 좋은지 설명하는 문서다.

이번 단계에서는 실제로 아래 3가지를 이해하는 것이 목표다.

1. `Controller`와 `Service`가 각각 무슨 역할을 하는지
2. GET API 함수가 어디에 위치해야 하는지
3. 요청 DTO → Service → 응답 DTO 흐름이 어떻게 연결되는지

Spring Boot는 보통 `Controller → Service → Repository → DB` 흐름으로 구성하는 것이 일반적이며, 책임을 분리할수록 유지보수가 쉬워진다. 또한 의존성 주입은 생성자 주입 방식이 널리 권장되며, 테스트와 유지보수에 유리하다.

---

## 먼저 큰 구조 이해하기
Spring Boot에서 각 레이어는 아래 역할을 가진다.

| 레이어 | 역할 | 지금 만들 함수 |
|---|---|---|
| Controller | HTTP 요청을 받는 입구 | `getNearbyRestaurants()` |
| Service | 실제 비즈니스 로직 처리 | `findNearbyRestaurants()` |
| Repository | DB 조회/저장 | 이번 단계에서는 아직 상세 구현 생략 |
| DTO | 요청/응답 데이터 전달 | `NearbyRestaurantRequest`, `PlaceNearbyResponse`, `NearbyRestaurantListResponse` |
| Entity | DB 테이블 구조 표현 | `Place`, `Category` |

즉, 브라우저나 프론트엔드가 `/api/places/nearby/restaurants`를 호출하면, **Controller가 요청을 받고 Service에게 일을 시키고, Service가 결과를 만들어 다시 Controller가 응답하는 구조**다.

---

## 왜 Controller와 Service를 나누는가
초보자 입장에서는 Controller 안에 모든 코드를 한 번에 쓰고 싶을 수 있다. 하지만 그렇게 되면 요청 처리, 검증, DB 조회, 거리 계산, DTO 변환이 한 파일에 섞이게 된다.

이렇게 되면 나중에 코드가 커졌을 때 아래 문제가 생긴다.

- API 함수가 너무 길어진다.
- 테스트하기 어려워진다.
- 재사용이 어렵다.
- 어떤 코드가 “비즈니스 로직”인지 분리해서 보기 어렵다.

따라서 Spring에서는 Controller는 **입구**, Service는 **핵심 처리 담당**으로 나누는 것이 유지보수에 좋다.

---

## 어디에 파일을 두는가
Spring Boot는 보통 메인 애플리케이션 클래스가 루트 패키지에 있고, 그 아래 하위 패키지들을 자동으로 스캔한다. 그래서 관련 클래스를 같은 루트 패키지 아래에 두는 것이 중요하다.

예를 들어 프로젝트 루트 패키지가 `com.daedongmat`라면, 아래처럼 두는 것이 자연스럽다.

```text
com.daedongmat
 ┣ place
 ┃ ┣ controller
 ┃ ┃ ┗ PlaceController.java
 ┃ ┣ service
 ┃ ┃ ┗ PlaceService.java
 ┃ ┗ dto
 ┃   ┣ NearbyRestaurantRequest.java
 ┃   ┣ PlaceNearbyResponse.java
 ┃   ┗ NearbyRestaurantListResponse.java
 ┣ entity
 ┃ ┣ Place.java
 ┃ ┗ Category.java
 ┗ DaedongmatApplication.java
```

이 구조의 장점은 “근처 밥집 조회 기능”과 관련된 파일을 `place` 아래에서 한 번에 찾을 수 있다는 점이다. Spring Boot 공식 문서도 루트 패키지 아래에 일관된 구조를 두는 것을 권장한다.

---

## 이번 단계에서 만들 함수 2개

### 1. Controller 함수
- 이름: `getNearbyRestaurants()`
- 역할: 프론트에서 GET 요청을 받는다.
- 위치: `PlaceController.java`

### 2. Service 함수
- 이름: `findNearbyRestaurants()`
- 역할: 요청값을 받아 실제 목록 데이터를 만들어 응답 DTO로 반환한다.
- 위치: `PlaceService.java`

이렇게 이름을 나누는 이유는 다음과 같다.

- Controller는 “HTTP GET 요청을 받는다”는 의미가 드러나는 이름이 좋다.
- Service는 “가까운 음식점을 찾는다”는 비즈니스 의미가 드러나는 이름이 좋다.

즉, Controller는 외부 요청 관점, Service는 내부 로직 관점의 이름을 쓰는 편이 읽기 쉽다.

---

## 요청은 어떻게 들어오는가
이번 API는 조회이므로 GET 방식을 사용한다. 조회 조건은 request body보다 query parameter로 받는 것이 일반적이며, Spring에서는 Controller에서 이를 바인딩해 사용할 수 있다.

예시 요청:

```http
GET /api/places/nearby/restaurants?lat=37.6202&lng=127.0611&radius=1000&size=20
```

이 요청이 오면 Spring이 query parameter를 `NearbyRestaurantRequest` 형태로 묶어 Controller에 전달할 수 있다.

---

## DTO 다시 정리
이번 흐름에서 DTO는 3개다.

### NearbyRestaurantRequest
클라이언트가 보내는 요청값 묶음
- 위도
- 경도
- 반경
- 조회 개수

### PlaceNearbyResponse
음식점 하나에 대한 응답 정보
- 장소 ID
- 이름
- 카테고리명
- 주소
- 좌표
- 거리

### NearbyRestaurantListResponse
최종 API 전체 응답
- 음식점 목록
- 개수
- 반경

DTO는 API 요청/응답 전용 구조이며, 엔티티를 외부에 직접 노출하지 않기 위한 역할도 한다.

---

## Controller 코드

파일 위치:
`src/main/java/com/daedongmat/place/controller/PlaceController.java`

```java
package com.daedongmat.place.controller;

import com.daedongmat.place.dto.NearbyRestaurantListResponse;
import com.daedongmat.place.dto.NearbyRestaurantRequest;
import com.daedongmat.place.service.PlaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;

    @GetMapping("/nearby/restaurants")
    public NearbyRestaurantListResponse getNearbyRestaurants(
            @Valid @ModelAttribute NearbyRestaurantRequest request
    ) {
        return placeService.findNearbyRestaurants(request);
    }
}
```

### 코드 설명

#### `@RestController`
이 클래스가 REST API 요청을 처리하는 클래스라는 뜻이다. 반환값은 JSON으로 응답된다.

#### `@RequestMapping("/api/places")`
이 컨트롤러가 처리하는 URL의 공통 시작 경로다. 즉 이 클래스 안의 API들은 `/api/places` 아래에 매핑된다.

#### `@RequiredArgsConstructor`
`final` 필드에 대한 생성자를 Lombok이 자동 생성한다. Spring에서는 생성자 주입이 권장되며, `@RequiredArgsConstructor`는 이를 간결하게 표현하는 방식이다.

#### `private final PlaceService placeService;`
Controller가 직접 DB를 만지지 않고, Service에게 일을 위임하기 위해 필요한 의존성이다. 이 의존성은 Spring이 자동으로 주입한다.

#### `@GetMapping("/nearby/restaurants")`
HTTP GET 요청 중 `/api/places/nearby/restaurants` 경로를 이 함수가 처리한다.

#### `@ModelAttribute NearbyRestaurantRequest request`
GET 요청의 query parameter를 DTO 객체에 자동으로 묶어준다. 예를 들어 `lat=...&lng=...` 같은 값이 `NearbyRestaurantRequest`에 들어간다.

#### `@Valid`
DTO에 작성한 검증 조건을 활성화한다. 잘못된 좌표나 비정상 반경 값이 들어오면 자동으로 검증할 수 있다.

#### `return placeService.findNearbyRestaurants(request);`
Controller는 직접 계산하지 않는다. 받은 요청을 Service에게 넘기고, Service 결과를 그대로 반환한다. 이 단순함이 유지보수에 좋다.

---

## Service 코드

파일 위치:
`src/main/java/com/daedongmat/place/service/PlaceService.java`

```java
package com.daedongmat.place.service;

import com.daedongmat.place.dto.NearbyRestaurantListResponse;
import com.daedongmat.place.dto.NearbyRestaurantRequest;
import com.daedongmat.place.dto.PlaceNearbyResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PlaceService {

    public NearbyRestaurantListResponse findNearbyRestaurants(NearbyRestaurantRequest request) {

        int radius = request.radius() != null ? request.radius() : 1000;

        List<PlaceNearbyResponse> places = List.of(
                new PlaceNearbyResponse(
                        1L,
                        "대동국밥",
                        "한식",
                        "서울특별시 노원구 광운로 00",
                        new BigDecimal("37.6205123"),
                        new BigDecimal("127.0609231"),
                        183
                ),
                new PlaceNearbyResponse(
                        2L,
                        "청년제육",
                        "돼지고기",
                        "서울특별시 노원구 월계로 00",
                        new BigDecimal("37.6198811"),
                        new BigDecimal("127.0621177"),
                        274
                )
        );

        return new NearbyRestaurantListResponse(
                places,
                places.size(),
                radius
        );
    }
}
```

### 코드 설명

#### `@Service`
이 클래스가 비즈니스 로직을 담당하는 서비스 계층이라는 뜻이다. Spring이 Bean으로 등록해 Controller에서 주입받을 수 있다.

#### `findNearbyRestaurants()`
이 함수가 실제 핵심 역할을 한다.

현재 단계에서는 아직 Repository와 DB를 붙이지 않았기 때문에, 더미 데이터를 직접 만들어 응답 DTO로 반환한다. 이렇게 하면 Controller-Service 연결부터 먼저 검증할 수 있다.

즉 지금은 다음 순서로 이해하면 된다.

1. 요청 DTO 받기
2. 기본 반경값 결정
3. 응답 DTO 리스트 만들기
4. 최종 래퍼 DTO 반환

나중에는 이 함수 안에서 아래 작업이 추가된다.

- Repository 호출
- `placeType = RESTAURANT` 필터
- 거리 계산
- 반경 1km 필터링
- 거리순 정렬
- DTO 변환

---

## 왜 지금은 더미 데이터를 쓰는가
처음부터 Repository, JPA, DB, 거리 계산까지 한 번에 붙이면 어디서 문제가 나는지 구분하기 어렵다.

그래서 학습 순서는 아래처럼 가는 것이 좋다.

1. **Controller와 Service 연결 확인**
2. DTO 응답 구조 확인
3. Repository 연결
4. 실제 DB 조회
5. 거리 계산 추가
6. 예외 처리 고도화

이 순서로 가면 어떤 레이어에서 문제가 발생하는지 쉽게 파악할 수 있다.

---

## Controller와 Service는 어떻게 연결되는가
이 연결은 **생성자 주입**으로 이루어진다. Spring은 `PlaceController`를 만들 때, 생성자에 필요한 `PlaceService` 객체를 자동으로 넣어준다.

이 방식이 좋은 이유는 다음과 같다.

- 필요한 의존성이 명확하다.
- 테스트 시 가짜 Service를 넣기 쉽다.
- 필드 주입보다 안정적이다.

즉,

- `PlaceController`는 `PlaceService` 없이는 동작할 수 없고
- 이 관계를 생성자에서 강제함으로써 더 안전한 코드가 된다.

---

## 유지보수성이 좋은 이유
이 구조가 유지보수성이 좋은 이유는 책임이 분리되어 있기 때문이다.

### Controller는 얇게 유지
Controller는 URL, HTTP 메서드, 요청 DTO 바인딩, 응답 반환만 담당한다. 그래서 API 입구를 읽기 쉽다.

### Service는 로직 집중
거리 계산, 필터링, DTO 조합 등은 Service에서 처리한다. 따라서 기능 로직을 한 곳에서 관리할 수 있다.

### 추후 변경이 쉬움
예를 들어 응답 형식이 바뀌어도 Service와 DTO만 수정하면 되고, DB 구조가 바뀌어도 Repository와 Service 중심으로 대응할 수 있다.

---

## 실제 저장할 파일 5개
이번 단계에서 저장해볼 파일은 아래 5개다.

```text
src/main/java/com/daedongmat/place/dto/NearbyRestaurantRequest.java
src/main/java/com/daedongmat/place/dto/PlaceNearbyResponse.java
src/main/java/com/daedongmat/place/dto/NearbyRestaurantListResponse.java
src/main/java/com/daedongmat/place/controller/PlaceController.java
src/main/java/com/daedongmat/place/service/PlaceService.java
```

---

## 지금 단계의 실행 흐름
앱이 실행된 뒤 아래 요청이 들어온다고 가정한다.

```http
GET /api/places/nearby/restaurants?lat=37.6202&lng=127.0611&radius=1000&size=20
```

흐름은 다음과 같다.

1. `PlaceController.getNearbyRestaurants()`가 요청을 받는다.
2. Spring이 query parameter를 `NearbyRestaurantRequest`에 담아준다.
3. Controller가 `placeService.findNearbyRestaurants(request)`를 호출한다.
4. Service가 더미 음식점 목록을 만든다.
5. `NearbyRestaurantListResponse`를 반환한다.
6. Spring이 이를 JSON으로 변환해 응답한다.

이 흐름만 이해해도 Spring의 기본 구조를 크게 이해한 것이다.

---

## 다음 단계
이제 이 구조가 이해되면, 다음에는 아래 순서로 확장하면 된다.

1. `PlaceRepository` 추가
2. Service에서 더미 데이터 대신 DB 조회
3. `Place` 엔티티를 `PlaceNearbyResponse`로 변환
4. 거리 계산 함수 추가
5. 반경 필터링 적용

즉, 지금 단계는 **Spring API의 뼈대를 세우는 단계**라고 보면 된다.
