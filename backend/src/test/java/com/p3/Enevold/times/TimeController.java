package com.p3.Enevold.time;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TimeControllerTest {

    private TimeRepository repo;
    private TimeController controller;

    @BeforeEach
    void setUp() {
        repo = mock(TimeRepository.class);
        controller = new TimeController(repo);
    }

    @Test
    void getTimes_returnsAllFromRepository() {
        Time t1 = new Time();
        t1.setId("1");
        Time t2 = new Time();
        t2.setId("2");

        when(repo.findAll()).thenReturn(List.of(t1, t2));

        List<Time> result = controller.getTimes();

        assertEquals(2, result.size());
        assertEquals("1", result.get(0).getId());
        assertEquals("2", result.get(1).getId());
        verify(repo).findAll();
    }

    @Test
    void start_createsAndSavesTimeWithUserAndCase() {
        when(repo.save(any(Time.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = controller.start(
                "09:00",
                "user-1",
                "Alice",
                "case-123"
        );

        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody() instanceof Time);
        Time saved = (Time) response.getBody();

        assertEquals("09:00", saved.getStartTime());
        assertEquals("user-1", saved.getUserId());
        assertEquals("Alice", saved.getUserName());
        assertEquals("case-123", saved.getCaseId());
        verify(repo).save(any(Time.class));
    }

    @Test
    void start_handlesExceptionAndReturnsBadRequest() {
        when(repo.save(any(Time.class))).thenThrow(new RuntimeException("db error"));

        ResponseEntity<?> response = controller.start(
                "09:00",
                "user-1",
                "Alice",
                null
        );

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("RuntimeException", body.get("error"));
    }

    @Test
    void updateByStartTime_returnsNotFoundWhenOriginalNotFound() {
        when(repo.findByStartTime("08:00")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.updateByStartTime(
                "09:00",
                "10:00",
                "1:00",
                "desc",
                "2025-01-01",
                "case-1",
                "08:00"
        );

        assertEquals(404, response.getStatusCode().value());
        verify(repo).findByStartTime("08:00");
        verify(repo, never()).save(any());
    }

    @Test
    void updateByStartTime_updatesFieldsAndSaves() {
        Time existing = new Time();
        existing.setStartTime("08:00");
        existing.setStopTime("09:00");
        existing.setTotalTime("1:00");
        existing.setDescription("old");
        existing.setDate("2025-01-01");
        existing.setCaseId("old-case");

        when(repo.findByStartTime("08:00")).thenReturn(Optional.of(existing));
        when(repo.save(any(Time.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = controller.updateByStartTime(
                "09:00",
                "11:00",
                "2:00",
                "new desc",
                "2025-02-02",
                "case-2",
                "08:00"
        );

        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody() instanceof Time);
        Time saved = (Time) response.getBody();

        assertEquals("09:00", saved.getStartTime());
        assertEquals("11:00", saved.getStopTime());
        assertEquals("2:00", saved.getTotalTime());
        assertEquals("new desc", saved.getDescription());
        assertEquals("2025-02-02", saved.getDate());
        assertEquals("case-2", saved.getCaseId());

        verify(repo).findByStartTime("08:00");
        verify(repo).save(existing);
    }

    @Test
    void getLastTime_returnsNoContentWhenNoTimeFound() {
        when(repo.findFirstByUserIdOrderByStartTimeDesc("user-1")).thenReturn(Optional.empty());
        when(repo.findById("user-1")).thenReturn(Optional.empty());

        ResponseEntity<TimeController.TimeEntryDto> response = controller.getLastTime("user-1");

        assertEquals(204, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    void getLastTime_usesLatestTimeFromUser() {
        Time time = new Time();
        time.setStartTime("09:00");
        time.setStopTime("10:00");

        when(repo.findFirstByUserIdOrderByStartTimeDesc("user-1")).thenReturn(Optional.of(time));

        ResponseEntity<TimeController.TimeEntryDto> response = controller.getLastTime("user-1");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("09:00", response.getBody().startTime());
        assertEquals("10:00", response.getBody().stopTime());
    }

    @Test
    void getTimesByCase_returnsNoContentWhenEmpty() {
        when(repo.findByCaseId("case-1")).thenReturn(List.of());

        ResponseEntity<List<Time>> response = controller.getTimesByCase("case-1");

        assertEquals(204, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    void getTimesByCase_returnsListWhenNotEmpty() {
        Time t = new Time();
        t.setCaseId("case-1");

        when(repo.findByCaseId("case-1")).thenReturn(List.of(t));

        ResponseEntity<List<Time>> response = controller.getTimesByCase("case-1");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("case-1", response.getBody().get(0).getCaseId());
    }

    @Test
    void getTimesByUser_returnsNoContentWhenEmpty() {
        when(repo.findByUserId("user-1")).thenReturn(List.of());

        ResponseEntity<List<Time>> response = controller.getTimesByUser("user-1");

        assertEquals(204, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    void getTimesByUser_returnsListWhenNotEmpty() {
        Time t = new Time();
        t.setUserId("user-1");

        when(repo.findByUserId("user-1")).thenReturn(List.of(t));

        ResponseEntity<List<Time>> response = controller.getTimesByUser("user-1");

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("user-1", response.getBody().get(0).getUserId());
    }
}
