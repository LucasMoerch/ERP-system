package com.p3.Enevold.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Value("${app.allowed-origins:http://localhost:5173}")
    private String allowedOriginsCsv;

    private final SessionAuthenticationFilter sessionAuthFilter;

    public SecurityConfig(SessionAuthenticationFilter sessionAuthFilter) {
        this.sessionAuthFilter = sessionAuthFilter;
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, SessionAuthenticationFilter f) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // Context-path '/api' open endpoints
                        .requestMatchers("/ping", "/users/activate", "/me", "/me/logout").permitAll()
                        // Everything else under the context-path 'api' requires auth
                        .anyRequest().authenticated())
                // Insert session auth before Spring filter
                .addFilterBefore(sessionAuthFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        var cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.stream(allowedOriginsCsv.split(",")).map(String::trim).toList());
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-Requested-With"));
        cfg.setAllowCredentials(true);
        var src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
