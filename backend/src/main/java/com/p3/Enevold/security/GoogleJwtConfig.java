package com.p3.Enevold.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration
public class GoogleJwtConfig {

    @Value("${app.google.client-id}")
    private String googleClientId;

    // Validate signature via Google
    @Bean
    public JwtDecoder googleJwtDecoder() {
        // DOCS: https://cloud.google.com/api-gateway/docs/authenticating-users-googleid
        NimbusJwtDecoder decoder =
                NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                        .build();

        OAuth2TokenValidator<Jwt> issuer = JwtValidators.createDefaultWithIssuer("https://accounts.google.com");
        OAuth2TokenValidator<Jwt> audience = jwt ->
                jwt.getAudience().contains(googleClientId)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "wrong audience", ""));

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(issuer, audience));
        return decoder;
    }
}
