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
     * 개발용 프론트 오리진. 배포 시에는 실제 도메인으로 바꾼다.
     * 콤마로 구분된 문자열을 Spring이 List로 변환해 준다.
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
        configuration.setAllowedHeaders(List.of("Content-Type", "X-User-Key"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);

        return source;
    }
}
