package com.p3.Enevold.cases;

import com.p3.Enevold.utils.FileDocument;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CaseTest {

    @Test
    void gettersAndSetters_workAsExpected() {
        Case c = new Case();

        String clientId = "client-1";
        String title = "Case Title";
        String description = "Case description";
        String status = "OPEN";
        List<String> assignedUsers = List.of("user-1", "user-2");

        Date updatedAt = new Date();

        List<FileDocument> docs = new ArrayList<>();
        FileDocument doc = new FileDocument();
        docs.add(doc);

        c.setClientId(clientId);
        c.setTitle(title);
        c.setDescription(description);
        c.setStatus(status);
        c.setAssignedUserIds(assignedUsers);
        c.setUpdatedAt(updatedAt);
        c.setDocuments(docs);

        // id, createdAt, createdBy are managed by Spring Data
        assertNull(c.getId());
        assertNull(c.getCreatedAt());
        assertNull(c.getCreatedBy());

        assertEquals(clientId, c.getClientId());
        assertEquals(title, c.getTitle());
        assertEquals(description, c.getDescription());
        assertEquals(status, c.getStatus());
        assertEquals(assignedUsers, c.getAssignedUserIds());
        assertEquals(updatedAt, c.getUpdatedAt());

        assertNotNull(c.getDocuments());
        assertEquals(1, c.getDocuments().size());
        assertSame(doc, c.getDocuments().get(0));
    }

    @Test
    void documents_isInitializedByDefault() {
        Case c = new Case();

        assertNotNull(c.getDocuments());
        assertTrue(c.getDocuments().isEmpty());
    }
}
