package com.p3.Enevold.cases;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CaseControllerAdminTest {

    private CaseRepository repo;
    private CaseControllerAdmin controller;

    @BeforeEach
    void setUp() {
        repo = mock(CaseRepository.class);
        controller = new CaseControllerAdmin();
        // inject mock into private field 'repo'
        ReflectionTestUtils.setField(controller, "repo", repo);
    }

    @Test
    void deleteCase_returnsBadRequestWhenCaseNotFound() {
        when(repo.findById("123")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.deleteCase("123");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertInstanceOf(Map.class, response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Case not found", body.get("error"));
        verify(repo, never()).deleteById(anyString());
    }

    @Test
    void deleteCase_deletesAndReturnsOkWhenFound() {
        Case c = new Case();
        when(repo.findById("123")).thenReturn(Optional.of(c));

        ResponseEntity<?> response = controller.deleteCase("123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertInstanceOf(Map.class, response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Case deleted successfully", body.get("message"));
        assertEquals("123", body.get("caseId"));
        verify(repo).deleteById("123");
    }

    @Test
    void deleteCase_onExceptionReturnsBadRequestWithErrorMessage() {
        when(repo.findById("123")).thenThrow(new RuntimeException("db error"));

        ResponseEntity<?> response = controller.deleteCase("123");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertInstanceOf(Map.class, response.getBody());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("db error", body.get("error"));
    }
}
