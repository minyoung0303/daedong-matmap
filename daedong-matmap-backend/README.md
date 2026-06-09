# Daedong Matmap Backend

근처 맛집 찾기 애플리케이션 백엔드 서비스

## 기술 스택

- **Java**: 21 (LTS)
- **Framework**: Spring Boot 3.3.0
- **Build Tool**: Maven
- **Database**: PostgreSQL
- **ORM**: JPA/Hibernate
- **API**: RESTful

## 프로젝트 구조

```
src/
├── main/
│   ├── java/com/daedongmat/
│   │   ├── controller/        # REST API 컨트롤러
│   │   ├── service/           # 비즈니스 로직
│   │   ├── repository/        # 데이터 접근 계층
│   │   ├── entity/            # JPA 엔티티
│   │   ├── dto/               # DTO (Data Transfer Object)
│   │   ├── exception/         # 커스텀 예외
│   │   ├── config/            # 설정 클래스
│   │   └── DaedongMatmapBackendApplication.java
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       └── db/
│           └── migration/     # Flyway 마이그레이션 (선택)
└── test/

```

## 설정 및 실행

### 필수 요구사항
- JDK 21+
- Maven 3.6+
- PostgreSQL 12+

### 데이터베이스 설정

```sql
CREATE DATABASE daedongmat;
CREATE USER daedongmat WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE daedongmat TO daedongmat;
```

### 환경 설정

`src/main/resources/application-dev.yml` 파일 생성:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/daedongmat
    username: daedongmat
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
```

### 빌드 및 실행

```bash
# 빌드
mvn clean package

# 개발 환경 실행
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"

# 또는
java -jar target/daedong-matmap-backend-1.0.0-SNAPSHOT.jar --spring.profiles.active=dev
```

## API 엔드포인트

- `GET /api/places/nearby` - 근처 음식점 조회
- `GET /api/places/{id}` - 음식점 상세 조회
- `GET /api/categories` - 카테고리 목록

## 개발 노트

- Lombok 사용으로 보일러플레이트 코드 최소화
- Geodesy 라이브러리로 거리 계산
- Validation으로 입력값 검증
- DevTools로 핫 리로드 지원
