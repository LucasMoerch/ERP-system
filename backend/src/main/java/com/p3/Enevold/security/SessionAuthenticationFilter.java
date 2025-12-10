package com.p3.Enevold.security;

import com.p3.Enevold.users.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final UserRepository repo;

    public SessionAuthenticationFilter(UserRepository repo) {
        this.repo = repo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        System.out.println("SessionAuthenticationFilter");
        // Dont overwrite if already authenticated
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            HttpSession session = request.getSession(false);
            System.out.println("SessionAuthenticationFilter2");
            if (session != null) {
                String uid = (String) session.getAttribute("uid");
                System.out.println("SessionAuthenticationFilter3");
                if (uid != null) {
                    var userOpt = repo.findById(uid);
                    System.out.println("SessionAuthenticationFilter4");
                    if (userOpt.isPresent()) {
                        var user = userOpt.get();

                        // Map DB roles to Spring authorities "ROLE_ADMIN","ROLE_STAFF"
                        List<SimpleGrantedAuthority> authorities = (user.getRoles() == null ? List.<String>of() : user.getRoles())
                                .stream()
                                .filter(r -> r != null && !r.isBlank())
                                .map(String::toUpperCase)
                                .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                                .map(SimpleGrantedAuthority::new)
                                .toList();


                        System.out.println("SESSION FILTER: roles=" + user.getRoles());
                        System.out.println("SESSION FILTER: authorities=" + authorities);
                        // principal = user id (String)
                        var auth = new UsernamePasswordAuthenticationToken(uid, null, authorities);
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    // Principal to read from SecurityContext
    public record SessionUserPrincipal(String id, String email, List<String> roles) {
    }
}
