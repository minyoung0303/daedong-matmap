package com.daedongmat.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * 보안 설정.
 *
 * 주의: 현재는 모든 요청을 permitAll로 열어두고 있다.
 * 사용자 식별을 X-User-Key 헤더로만 하고 있어서, 남의 키를 알면 그 사람 리뷰를 수정할 수 있다.
 * MVP 단계에서는 감수하는 부분이고, 실제 출시 전에는 토스 인증이나 서버 검증을 붙여야 한다.
 */
@Configuration
public class SecurityConfig {

    /**
     * 허용할 프론트 오리진.
     * 하드코딩하지 않고 프로퍼티로 빼서 배포 환경에서 덮어쓸 수 있게 한다.
     * (application.yml 의 app.cors.allowed-origins, 콤마로 구분)
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 쿠키 세션을 쓰지 않는 순수 API 서버라 CSRF 토큰이 필요 없다.
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        return http.build();
    }

    /**
     * CORS 설정.
     * 개발 중에는 Vite 프록시를 쓰기 때문에 동일 출처로 취급되어 CORS가 필요 없지만,
     * 프론트를 따로 띄워 직접 호출할 때를 위해 열어둔다.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // 실제로 쓰는 헤더만 허용한다. 헤더를 추가할 때 이 목록도 같이 늘려야 한다.
        // (와일드카드가 편하지만, 허용 범위를 눈으로 확인할 수 있게 명시해 둔다)
        configuration.setAllowedHeaders(List.of("Content-Type", "X-User-Key", "Authorization"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        // preflight 응답을 캐시해 OPTIONS 요청을 줄인다.
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
