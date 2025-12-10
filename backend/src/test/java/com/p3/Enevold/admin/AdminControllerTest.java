package com.p3.Enevold.admin;

import com.p3.Enevold.users.User;
import com.p3.Enevold.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminControllerTest {

    private UserRepository repo;
    private AdminController controller;

    @BeforeEach
    void setUp() {
        repo = mock(UserRepository.class);
        controller = new AdminController(repo);
    }

    @Test
    void inviteNewUser_returnsBadRequestWhenRequestIsNull() {
        ResponseEntity<?> response = controller.inviteNewUser(null);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("InvalidRequest", body.get("error"));
        verifyNoInteractions(repo);
    }

    @Test
    void inviteNewUser_returnsBadRequestWhenEmailMissing() {
        InvitationRequest request = mock(InvitationRequest.class);
        when(request.getEmail()).thenReturn(null);

        ResponseEntity<?> response = controller.inviteNewUser(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("InvalidRequest", body.get("error"));
        verifyNoInteractions(repo);
    }

    @Test
    void inviteNewUser_createsNewInvitedUserWhenNotExisting_andFiltersRoles() {
        InvitationRequest request = mock(InvitationRequest.class);
        when(request.getEmail()).thenReturn("NEWUSER@EXAMPLE.COM");
        when(request.getRoles()).thenReturn(List.of("staff", "ADMIN", "unknown"));
        when(request.getFirstName()).thenReturn("Alice");
        when(request.getLastName()).thenReturn("Doe");
        when(request.getFullName()).thenReturn("Alice Doe");
        when(request.getPhone()).thenReturn("12345678");
        when(request.getAddress()).thenReturn("Some Street 1");
        when(request.getCPR()).thenReturn("123456-7890");

        when(repo.findByAuthEmail("newuser@example.com")).thenReturn(Optional.empty());
        when(repo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = controller.inviteNewUser(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof User);
        User saved = (User) response.getBody();

        // status and roles
        assertEquals("invited", saved.getStatus());
        assertNotNull(saved.getRoles());
        assertEquals(List.of("staff"), saved.getRoles());

        // auth fields
        assertNotNull(saved.getAuth());
        assertEquals("google", saved.getAuth().getProvider());
        assertEquals("newuser@example.com", saved.getAuth().getEmail());
        assertFalse(saved.getAuth().isEmailVerified());

        // profile fields
        assertNotNull(saved.getProfile());
        assertEquals("Alice", saved.getProfile().getFirstName());
        assertEquals("Doe", saved.getProfile().getLastName());
        assertEquals("Alice Doe", saved.getProfile().getDisplayName());
        assertEquals("12345678", saved.getProfile().getPhone());
        assertEquals("Some Street 1", saved.getProfile().getAddress());
        assertEquals("123456-7890", saved.getProfile().getCPR());

        verify(repo).findByAuthEmail("newuser@example.com");
        verify(repo).save(any(User.class));
    }

    @Test
    void inviteNewUser_returnsConflictWhenUserAlreadyExists() {
        InvitationRequest request = mock(InvitationRequest.class);
        when(request.getEmail()).thenReturn("existing@example.com");

        User existing = new User();
        when(repo.findByAuthEmail("existing@example.com")).thenReturn(Optional.of(existing));

        ResponseEntity<?> response = controller.inviteNewUser(request);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("UserAlreadyActive", body.get("error"));
        assertTrue(body.get("message").toString().contains("existing@example.com"));
        verify(repo).findByAuthEmail("existing@example.com");
        verify(repo, never()).save(any());
    }

    @Test
    void inviteNewUser_handlesIllegalArgumentExceptionFromSave() {
        InvitationRequest request = mock(InvitationRequest.class);
        when(request.getEmail()).thenReturn("new@example.com");
        when(request.getRoles()).thenReturn(List.of("staff"));

        when(repo.findByAuthEmail("new@example.com")).thenReturn(Optional.empty());
        when(repo.save(any(User.class))).thenThrow(new IllegalArgumentException("bad arg"));

        ResponseEntity<?> response = controller.inviteNewUser(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("InvalidArgument", body.get("error"));
        assertEquals("bad arg", body.get("message"));
    }

    @Test
    void inviteNewUser_handlesGenericExceptionFromSave() {
        InvitationRequest request = mock(InvitationRequest.class);
        when(request.getEmail()).thenReturn("new@example.com");
        when(request.getRoles()).thenReturn(List.of("staff"));

        when(repo.findByAuthEmail("new@example.com")).thenReturn(Optional.empty());
        when(repo.save(any(User.class))).thenThrow(new RuntimeException("boom"));

        ResponseEntity<?> response = controller.inviteNewUser(request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("InternalError", body.get("error"));
        assertEquals("boom", body.get("message"));
    }
}
