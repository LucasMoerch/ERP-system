package com.p3.Enevold.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class SecurityConfigCorsTest {

    @Test
    void corsConfigurationSource_usesAllowedOriginsCsvAndMethods() {
        // mock filter just to satisfy constructor
        SessionAuthenticationFilter filter = mock(SessionAuthenticationFilter.class);

        SecurityConfig config = new SecurityConfig(filter);

        // simulate @Value injection
        var allowed = "http://localhost:5173,https://example.com";
        var allowedField = SecurityConfig.class
                .getDeclaredFields()[0]; // or use ReflectionTestUtils
        allowedField.setAccessible(true);
        try {
            allowedField.set(config, allowed);
        } catch (IllegalAccessException e) {
            fail(e);
        }

        CorsConfigurationSource source = invokeCorsConfigurationSource(config);

        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/some/path");
        CorsConfiguration cors = source.getCorsConfiguration(req);
        assertNotNull(cors);

        assertEquals(
                List.of("http://localhost:5173", "https://example.com"),
                cors.getAllowedOrigins()
        );
        assertTrue(cors.getAllowedMethods().containsAll(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        ));
        assertTrue(cors.getAllowCredentials());
        assertTrue(cors.getAllowedHeaders().contains("Authorization"));
    }

    // helper to access private method
    private CorsConfigurationSource invokeCorsConfigurationSource(SecurityConfig config) {
        try {
            var m = SecurityConfig.class.getDeclaredMethod("corsConfigurationSource");
            m.setAccessible(true);
            return (CorsConfigurationSource) m.invoke(config);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
