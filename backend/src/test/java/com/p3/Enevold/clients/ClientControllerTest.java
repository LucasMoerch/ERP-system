package com.p3.Enevold.clients;

import com.p3.Enevold.utils.FileDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ClientControllerTest {

    private ClientRepository clientRepository;
    private ClientController controller;

    @BeforeEach
    void setUp() {
        clientRepository = mock(ClientRepository.class);
        controller = new ClientController();
        // field injection in test to match @Autowired in controller
        controller.clientRepository = clientRepository;
    }

    @Test
    void addClient_clearsIdAndSaves() {
        Client input = new Client();
        input.setId("should-be-cleared");
        input.setName("Acme");

        Client saved = new Client();
        saved.setId("generated-id");
        saved.setName("Acme");

        when(clientRepository.save(any(Client.class))).thenReturn(saved);

        ResponseEntity<Client> response = controller.addClient(input);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(saved, response.getBody());
        // verify that the client passed to save had id cleared
        verify(clientRepository).save(argThat(c -> c.getId() == null && "Acme".equals(c.getName())));
    }

    @Test
    void getClient_returnsClientWhenFound() {
        Client client = new Client();
        client.setId("123");
        when(clientRepository.findById("123")).thenReturn(Optional.of(client));

        Client result = controller.getClient("123");

        assertSame(client, result);
    }

    @Test
    void getClient_returnsNullWhenNotFound() {
        when(clientRepository.findById("missing")).thenReturn(Optional.empty());

        Client result = controller.getClient("missing");

        assertNull(result);
    }

    @Test
    void putClient_returnsNotFoundWhenClientMissing() {
        when(clientRepository.findById("123")).thenReturn(Optional.empty());

        ResponseEntity<Client> response = controller.putClient("123", new Client());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
        verify(clientRepository, never()).save(any());
    }

    @Test
    void putClient_savesAndReturnsUpdatedClient() {
        Client existing = new Client();
        existing.setId("123");
        when(clientRepository.findById("123")).thenReturn(Optional.of(existing));

        Client body = new Client();
        body.setId("123");
        body.setName("Updated");
        when(clientRepository.save(body)).thenReturn(body);

        ResponseEntity<Client> response = controller.putClient("123", body);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(body, response.getBody());
        verify(clientRepository).save(body);
    }

    @Test
    void deleteClient_returnsNotFoundWhenMissing() {
        when(clientRepository.existsById("123")).thenReturn(false);

        ResponseEntity<?> response = controller.deleteClient("123");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(clientRepository, never()).deleteById(any());
    }

    @Test
    void deleteClient_deletesAndReturnsNoContent() {
        when(clientRepository.existsById("123")).thenReturn(true);

        ResponseEntity<?> response = controller.deleteClient("123");

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(clientRepository).deleteById("123");
    }

    @Test
    void uploadDocument_returnsNotFoundWhenClientMissing() throws IOException {
        when(clientRepository.findById("123")).thenReturn(Optional.empty());
        MultipartFile file = mock(MultipartFile.class);

        ResponseEntity<String> response =
                controller.uploadDocument("123", file, "creator");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Client not found", response.getBody());
        verify(clientRepository, never()).save(any());
    }

    @Test
    void uploadDocument_addsDocumentAndSavesClient() throws IOException {
        Client client = new Client();
        client.setId("123");
        client.setDocuments(new ArrayList<>());

        when(clientRepository.findById("123")).thenReturn(Optional.of(client));
        when(clientRepository.save(client)).thenReturn(client);

        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("test.txt");
        when(file.getContentType()).thenReturn("text/plain");
        when(file.getBytes()).thenReturn("hello".getBytes());

        ResponseEntity<String> response =
                controller.uploadDocument("123", file, "Alice");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("File uploaded successfully"));
        assertEquals(1, client.getDocuments().size());
        FileDocument doc = client.getDocuments().get(0);
        assertEquals("test.txt", doc.getFileName());
        assertEquals("text/plain", doc.getContentType());
        assertEquals("Alice", doc.getCreatedBy());
        assertNotNull(doc.getUploadedAt());
        assertArrayEquals("hello".getBytes(), doc.getData());
        verify(clientRepository).save(client);
    }

    @Test
    void getFileDocuments_returnsNotFoundWhenClientMissing() {
        when(clientRepository.findById("123")).thenReturn(Optional.empty());

        ResponseEntity<List<FileDocument>> response =
                controller.getFileDocuments("123");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void getFileDocuments_returnsDocumentsWhenClientFound() {
        Client client = new Client();
        List<FileDocument> docs = new ArrayList<>();
        docs.add(new FileDocument());
        client.setDocuments(docs);
        when(clientRepository.findById("123")).thenReturn(Optional.of(client));

        ResponseEntity<List<FileDocument>> response =
                controller.getFileDocuments("123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(docs, response.getBody());
    }

    @Test
    void downloadDocument_returnsNotFoundWhenClientMissingOrIndexInvalid() {
        when(clientRepository.findById("123")).thenReturn(Optional.empty());

        ResponseEntity<byte[]> response =
                controller.downloadDocument("123", 0);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void downloadDocument_returnsFileBytesAndHeaders() {
        FileDocument doc = new FileDocument();
        doc.setFileName("test.txt");
        doc.setContentType("text/plain");
        doc.setData("hello".getBytes());

        Client client = new Client();
        List<FileDocument> docs = new ArrayList<>();
        docs.add(doc);
        client.setDocuments(docs);

        when(clientRepository.findById("123")).thenReturn(Optional.of(client));

        ResponseEntity<byte[]> response =
                controller.downloadDocument("123", 0);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertArrayEquals("hello".getBytes(), response.getBody());
        assertEquals("text/plain", response.getHeaders().getContentType().toString());
        String dispo = response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION);
        assertNotNull(dispo);
        assertTrue(dispo.contains("test.txt"));
    }

    @Test
    void deleteDocument_returnsNotFoundWhenClientOrIndexInvalid() {
        when(clientRepository.findById("123")).thenReturn(Optional.empty());

        ResponseEntity<String> response =
                controller.deleteDocument("123", 0);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Client or document not found", response.getBody());
    }

    @Test
    void deleteDocument_removesDocumentAndSavesClient() {
        FileDocument doc = new FileDocument();
        Client client = new Client();
        List<FileDocument> docs = new ArrayList<>();
        docs.add(doc);
        client.setDocuments(docs);

        when(clientRepository.findById("123")).thenReturn(Optional.of(client));
        when(clientRepository.save(client)).thenReturn(client);

        ResponseEntity<String> response =
                controller.deleteDocument("123", 0);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Document deleted successfully", response.getBody());
        assertTrue(client.getDocuments().isEmpty());
        verify(clientRepository).save(client);
    }

    @Test
    void getAllClients_returnsListFromRepository() {
        List<Client> list = List.of(new Client(), new Client());
        when(clientRepository.findAll()).thenReturn(list);

        List<Client> result = controller.getAllClients();

        assertEquals(2, result.size());
        assertSame(list, result);
        verify(clientRepository).findAll();
    }
}
