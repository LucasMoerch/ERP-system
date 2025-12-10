package com.p3.Enevold.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class GoogleJwtConfigTest {

    @Test
    void googleJwtDecoder_createsNimbusDecoder() {
        GoogleJwtConfig config = new GoogleJwtConfig();
        // simulate @Value("${app.google.client-id}")
        ReflectionTestUtils.setField(config, "googleClientId", "test-client-id");

        JwtDecoder decoder = config.googleJwtDecoder();

        assertNotNull(decoder);
        assertInstanceOf(NimbusJwtDecoder.class, decoder);
    }

    @Test
    void audienceValidator_acceptsCorrectAudience_andRejectsWrongOne() {
        String clientId = "test-client-id";

        OAuth2TokenValidator<Jwt> issuerValidator =
                JwtValidators.createDefaultWithIssuer("https://accounts.google.com");
        OAuth2TokenValidator<Jwt> audienceValidator = jwt ->
                jwt.getAudience().contains(clientId)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(
                        new OAuth2Error("invalid_token", "wrong audience", "")
                );
        OAuth2TokenValidator<Jwt> validator =
                new DelegatingOAuth2TokenValidator<>(issuerValidator, audienceValidator);

        Jwt goodJwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("aud", List.of(clientId))
                .claim("iss", "https://accounts.google.com")
                .build();

        Jwt badJwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("aud", List.of("other-client"))
                .claim("iss", "https://accounts.google.com")
                .build();

        OAuth2TokenValidatorResult goodResult = validator.validate(goodJwt);
        OAuth2TokenValidatorResult badResult = validator.validate(badJwt);

        // success = no errors
        assertFalse(goodResult.hasErrors());

        // failure = hasErrors() true and contains our error
        assertTrue(badResult.hasErrors());
        assertFalse(badResult.getErrors().isEmpty());
        assertEquals("invalid_token", badResult.getErrors().iterator().next().getErrorCode());
    }
}
