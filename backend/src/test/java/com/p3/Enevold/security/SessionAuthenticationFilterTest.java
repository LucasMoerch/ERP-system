package com.p3.Enevold.security;

import com.p3.Enevold.users.User;
import com.p3.Enevold.users.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SessionAuthenticationFilterTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final SessionAuthenticationFilter filter = new SessionAuthenticationFilter(userRepository);

    private final HttpServletRequest request = mock(HttpServletRequest.class);
    private final HttpServletResponse response = mock(HttpServletResponse.class);
    private final FilterChain chain = mock(FilterChain.class);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doesNothing_whenAlreadyAuthenticated() throws ServletException, IOException {
        Authentication existingAuth = mock(Authentication.class);
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        filter.doFilterInternal(request, response, chain);

        assertSame(existingAuth, SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(userRepository);
        verify(chain).doFilter(request, response);
    }

    @Test
    void doesNothing_whenNoSession() throws ServletException, IOException {
        when(request.getSession(false)).thenReturn(null);

        filter.doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(userRepository);
        verify(chain).doFilter(request, response);
    }

    @Test
    void doesNothing_whenNoUidAttribute() throws ServletException, IOException {
        HttpSession session = mock(HttpSession.class);
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute("uid")).thenReturn(null);

        filter.doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(userRepository);
        verify(chain).doFilter(request, response);
    }

    @Test
    void doesNothing_whenUserNotFound() throws ServletException, IOException {
        HttpSession session = mock(HttpSession.class);
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute("uid")).thenReturn("user-1");
        when(userRepository.findById("user-1")).thenReturn(Optional.empty());

        filter.doFilterInternal(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(userRepository).findById("user-1");
        verify(chain).doFilter(request, response);
    }

    @Test
    void setsAuthentication_whenUserFoundWithRoles() throws ServletException, IOException {
        HttpSession session = mock(HttpSession.class);
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute("uid")).thenReturn("user-1");

        // mock User and return a roles list that includes values
        User user = mock(User.class);
        when(user.getRoles()).thenReturn(
                Arrays.asList("admin", " STAFF ", "ROLE_MANAGER", null, "")
        );
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        filter.doFilterInternal(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals("user-1", auth.getPrincipal());
        assertTrue(auth.isAuthenticated());

        var authorities = auth.getAuthorities();
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
        // matches current implementation: uppercased but not trimmed => "ROLE_ STAFF "
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ STAFF ")));
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER")));

        verify(userRepository).findById("user-1");
        verify(chain).doFilter(request, response);
    }
}
