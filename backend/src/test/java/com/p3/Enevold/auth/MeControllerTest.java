package com.p3.Enevold.auth;

import com.p3.Enevold.users.User;
import com.p3.Enevold.users.UserRepository;
import com.p3.Enevold.utils.FileDocument;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MeControllerTest {

    private UserRepository repo;
    private MeController controller;
    private HttpSession session;

    @BeforeEach
    void setUp() {
        repo = mock(UserRepository.class);
        controller = new MeController(repo);
        session = mock(HttpSession.class);
    }

    @Test
    void me_returnsUnauthenticatedWhenNoUidInSession() {
        when(session.getAttribute("uid")).thenReturn(null);

        ResponseEntity<?> response = controller.me(session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(Map.class, response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(false, body.get("authenticated"));
        verifyNoInteractions(repo);
    }

    @Test
    void me_returnsUnauthenticatedWhenUserNotFound() {
        when(session.getAttribute("uid")).thenReturn("user-1");
        when(repo.findById("user-1")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.me(session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(Map.class, response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(false, body.get("authenticated"));
        verify(repo).findById("user-1");
    }

    @Test
    void me_returnsUserDataWithDefaultsWhenProfileAndAuthNull() {
        when(session.getAttribute("uid")).thenReturn("user-1");

        // mock User and stub only the getters MeController uses
        User user = mock(User.class);
        Date createdAt = new Date();
        Date updatedAt = new Date();
        List<String> roles = List.of("ADMIN", "STAFF");
        FileDocument doc = new FileDocument();
        List<FileDocument> docs = List.of(doc);

        when(user.getId()).thenReturn("user-1");
        when(user.getRoles()).thenReturn(roles);
        when(user.getStatus()).thenReturn("active");
        when(user.getCreatedAt()).thenReturn(createdAt);
        when(user.getUpdatedAt()).thenReturn(updatedAt);
        when(user.getAuth()).thenReturn(null);
        when(user.getProfile()).thenReturn(null);
        when(user.getDocuments()).thenReturn(docs);

        when(repo.findById("user-1")).thenReturn(Optional.of(user));

        ResponseEntity<?> response = controller.me(session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(Map.class, response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();

        assertEquals(true, body.get("authenticated"));
        assertEquals("user-1", body.get("id"));

        // defaults where profile/auth are null
        assertEquals("", body.get("firstName"));
        assertEquals("", body.get("lastName"));
        assertEquals("", body.get("phone"));
        assertEquals("", body.get("address"));
        assertEquals("", body.get("email"));
        assertEquals("", body.get("displayName"));
        assertEquals("", body.get("pictureUrl"));
        assertEquals("", body.get("birthdate"));
        assertEquals("", body.get("cpr"));
        assertEquals("", body.get("bankReg"));
        assertEquals("", body.get("bankNumber"));

        // non-null fields
        assertEquals(roles, body.get("roles"));
        assertEquals("active", body.get("status"));
        assertEquals(createdAt, body.get("createdAt"));
        assertEquals(updatedAt, body.get("updatedAt"));

        Object docsObj = body.get("documents");
        assertInstanceOf(List.class, docsObj);
        List<?> docsFromResponse = (List<?>) docsObj;
        assertEquals(1, docsFromResponse.size());

        verify(repo).findById("user-1");
    }

    @Test
    void logout_invalidatesSessionAndReturnsOk() {
        ResponseEntity<?> response = controller.logout(session);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(Map.class, response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(true, body.get("ok"));
        verify(session).invalidate();
    }
}
