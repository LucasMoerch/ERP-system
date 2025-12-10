package com.p3.Enevold.users;

import com.p3.Enevold.utils.FileDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserControllerTest {

    private UserRepository repo;
    private JwtDecoder jwtDecoder;
    private UserController controller;

    @BeforeEach
    void setUp() {
        repo = mock(UserRepository.class);
        jwtDecoder = mock(JwtDecoder.class);
        controller = new UserController(repo, jwtDecoder);

        // Simulate @Value injection
        ReflectionTestUtils.setField(controller, "adminEmails", "admin@example.com");
    }

    @Test
    void activate_successfullyActivatesUserAndSetsSession() {
        // Arrange: JWT with claims
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", "google-sub-123")
                .claim("email", "Admin@Example.com") // will be lower-cased
                .claim("email_verified", true)
                .claim("name", "Admin User")
                .claim("picture", "http://example.com/avatar.png")
                .build();

        when(jwtDecoder.decode("id-token")).thenReturn(jwt);

        User invited = new User();
        invited.setStatus("invited");
        invited.setAuth(new User.Auth());
        invited.setRoles(List.of("staff")); // will be overridden to admin+staff
        invited.setDocuments(new ArrayList<>());

        when(repo.findByAuthEmail("admin@example.com")).thenReturn(Optional.of(invited));

        // make save assign an id
        when(repo.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            // fake id via reflection (no setter)
            ReflectionTestUtils.setField(u, "id", "user-123");
            return u;
        });

        MockHttpSession session = new MockHttpSession();

        // Act
        var response = controller.activate("id-token", session);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody() instanceof User);
        User saved = (User) response.getBody();

        assertEquals("active", saved.getStatus());
        assertNotNull(saved.getAuth());
        assertEquals("google-sub-123", saved.getAuth().getSub());
        assertEquals("admin@example.com", saved.getAuth().getEmail());
        assertTrue(saved.getAuth().isEmailVerified());
        assertEquals("http://example.com/avatar.png", saved.getAuth().getPictureUrl());

        // adminEmails contains this email, so roles should be admin + staff
        assertEquals(List.of("admin", "staff"), saved.getRoles());

        // session uid should be set to saved user id
        assertEquals("user-123", session.getAttribute("uid"));

        verify(repo).findByAuthEmail("admin@example.com");
        verify(repo).save(any(User.class));
    }

    @Test
    void activate_returnsBadRequestWhenEmailOrSubMissing() {
        // Missing email
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", "google-sub-123")
                .build();

        when(jwtDecoder.decode("bad-token")).thenReturn(jwt);

        MockHttpSession session = new MockHttpSession();

        var response = controller.activate("bad-token", session);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody() instanceof java.util.Map);
        var body = (java.util.Map<?, ?>) response.getBody();
        assertEquals("InvalidToken", body.get("error"));
    }

    @Test
    void uploadDocument_returnsNotFoundWhenUserMissing() {
        when(repo.findById("missing-id")).thenReturn(Optional.empty());

        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", "hello".getBytes()
        );

        var response = controller.uploadDocument("missing-id", file, "creator");

        assertEquals(404, response.getStatusCode().value());
        assertEquals("User not found", response.getBody());
        verify(repo).findById("missing-id");
        verify(repo, never()).save(any());
    }

    @Test
    void uploadDocument_savesDocumentAndReturnsOk() throws IOException {
        User user = new User();
        user.setDocuments(null); // controller should initialize list

        when(repo.findById("user-1")).thenReturn(Optional.of(user));
        when(repo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "pdf-bytes".getBytes()
        );

        var response = controller.uploadDocument("user-1", file, "creator-id");

        assertEquals(200, response.getStatusCode().value());
        assertTrue(((String) response.getBody()).contains("doc.pdf"));

        // user should now have one document
        assertNotNull(user.getDocuments());
        assertEquals(1, user.getDocuments().size());
        FileDocument doc = user.getDocuments().get(0);
        assertEquals("doc.pdf", doc.getFileName());
        assertEquals("application/pdf", doc.getContentType());
        assertArrayEquals("pdf-bytes".getBytes(), doc.getData());
        assertEquals("creator-id", doc.getCreatedBy());
        assertNotNull(doc.getUploadedAt());

        verify(repo).findById("user-1");
        verify(repo).save(any(User.class));
    }

    @Test
    void getFileDocuments_returnsNotFoundForMissingUser() {
        when(repo.findById("missing")).thenReturn(Optional.empty());

        var response = controller.getFileDocuments("missing");

        assertEquals(404, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    void getFileDocuments_returnsEmptyListWhenNoDocs() {
        User user = new User();
        user.setDocuments(null);
        when(repo.findById("user-1")).thenReturn(Optional.of(user));

        var response = controller.getFileDocuments("user-1");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void downloadDocument_returnsNotFoundForInvalidIndexOrUser() {
        when(repo.findById("missing")).thenReturn(Optional.empty());

        var resp1 = controller.downloadDocument("missing", 0);
        assertEquals(404, resp1.getStatusCode().value());
        assertNull(resp1.getBody());

        User user = new User();
        user.setDocuments(new ArrayList<>());
        when(repo.findById("user-1")).thenReturn(Optional.of(user));

        var resp2 = controller.downloadDocument("user-1", 0);
        assertEquals(404, resp2.getStatusCode().value());
        assertNull(resp2.getBody());
    }

    @Test
    void downloadDocument_returnsFileBytesAndHeaders() {
        FileDocument doc = new FileDocument();
        doc.setFileName("doc.txt");
        doc.setContentType("text/plain");
        doc.setData("content".getBytes());
        doc.setUploadedAt(new Date());
        doc.setCreatedBy("creator");

        User user = new User();
        user.setDocuments(new ArrayList<>(List.of(doc)));
        when(repo.findById("user-1")).thenReturn(Optional.of(user));

        var response = controller.downloadDocument("user-1", 0);

        assertEquals(200, response.getStatusCode().value());
        assertArrayEquals("content".getBytes(), response.getBody());
        assertEquals("text/plain", response.getHeaders().getContentType().toString());
        assertTrue(response.getHeaders().getFirst("Content-Disposition")
                .contains("doc.txt"));
    }

    @Test
    void deleteDocument_notFoundWhenUserOrIndexInvalid() {
        when(repo.findById("missing")).thenReturn(Optional.empty());

        var resp1 = controller.deleteDocument("missing", 0);
        assertEquals(404, resp1.getStatusCode().value());
        assertEquals("User or document not found", resp1.getBody());

        User user = new User();
        user.setDocuments(new ArrayList<>());

        when(repo.findById("user-1")).thenReturn(Optional.of(user));

        var resp2 = controller.deleteDocument("user-1", 0);
        assertEquals(404, resp2.getStatusCode().value());
        assertEquals("User or document not found", resp2.getBody());
    }

    @Test
    void deleteDocument_removesDocumentAndSavesUser() {
        FileDocument doc = new FileDocument();
        User user = new User();
        user.setDocuments(new ArrayList<>(List.of(doc)));

        when(repo.findById("user-1")).thenReturn(Optional.of(user));
        when(repo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.deleteDocument("user-1", 0);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("Document deleted successfully", response.getBody());
        assertTrue(user.getDocuments().isEmpty());

        verify(repo).save(user);
    }
}
