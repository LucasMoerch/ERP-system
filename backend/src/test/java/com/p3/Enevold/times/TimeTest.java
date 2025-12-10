package com.p3.Enevold.time;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TimeTest {

    @Test
    void gettersAndSettersWork() {
        Time time = new Time();

        time.setId("time-1");
        time.setCaseId("case-123");
        time.setUserId("user-456");
        time.setUserName("Alice Smith");
        time.setDate("2025-01-01");
        time.setStartTime("09:00");
        time.setStopTime("11:30");
        time.setTotalTime("2:30");
        time.setDescription("Worked on initial case review");

        assertEquals("time-1", time.getId());
        assertEquals("case-123", time.getCaseId());
        assertEquals("user-456", time.getUserId());
        assertEquals("Alice Smith", time.getUserName());
        assertEquals("2025-01-01", time.getDate());
        assertEquals("09:00", time.getStartTime());
        assertEquals("11:30", time.getStopTime());
        assertEquals("2:30", time.getTotalTime());
        assertEquals("Worked on initial case review", time.getDescription());
    }
}
