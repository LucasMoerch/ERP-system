package com.p3.Enevold.clients;

import com.p3.Enevold.utils.FileDocument;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ClientTest {

    @Test
    void gettersAndSetters_workAsExpected() {
        Client client = new Client();

        String id = "client-1";
        String name = "Acme Corp";
        String address = "123 Main St";
        String email = "contact@acme.test";
        String phone = "+45 12 34 56 78";
        String notes = "Important customer";

        Date createdAt = new Date();
        Date updatedAt = new Date();

        // prepare a documents list using the no-arg constructor
        List<FileDocument> docs = new ArrayList<>();
        FileDocument doc = new FileDocument(); // no-args
        docs.add(doc);

        client.setId(id);
        client.setName(name);
        client.setContactEmail(email);
        client.setContactPhone(phone);
        client.setNotes(notes);
        client.setDocuments(docs);

        assertEquals(id, client.getId());
        assertEquals(name, client.getName());
        assertEquals(email, client.getContactEmail());
        assertEquals(phone, client.getContactPhone());
        assertEquals(notes, client.getNotes());

        // createdAt/updatedAt are managed by Spring Data
        assertNull(client.getCreatedAt());
        assertNull(client.getUpdatedAt());

        assertNotNull(client.getDocuments());
        assertEquals(1, client.getDocuments().size());
        assertSame(doc, client.getDocuments().get(0));
    }

    @Test
    void documents_isInitializedByDefault() {
        Client client = new Client();

        assertNotNull(client.getDocuments());
        assertTrue(client.getDocuments().isEmpty());
    }
}
