package com.p3.Enevold.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableMongoAuditing
public class MongoAuditingConfig {
    @Bean
    public AuditorAware<String> auditorAware() {
        System.out.println("MongoAuditingConfig: Setting up AuditorAware bean");
        return () -> Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .filter(Authentication::isAuthenticated)
                .map(Authentication::getName) // returns the user id string
                .filter(name -> !"anonymousUser".equals(name));
    }
}
