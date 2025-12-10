package com.p3.Enevold.cases;

import com.p3.Enevold.utils.FileDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CaseControllerTest {

    private CaseRepository repo;
    private CaseController controller;

    @BeforeEach
    void setUp() {
        repo = mock(CaseRepository.class);
        controller = new CaseController();
        // inject mock into private field 'repo'
        ReflectionTestUtils.setField(controller, "repo", repo);
    }


    @Test
    void createCase_validStatus_savesWithNormalizedStatus() {
        when(repo.save(any(Case.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> response = controller.createCase("Title", "Desc", "open");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Case);
        Case saved = (Case) response.getBody();
        assertEquals("Title", saved.getTitle());
        assertEquals("Desc", saved.getDescription());
        assertEquals("OPEN", saved.getStatus());
        assertNotNull(saved.getAssignedUserIds());
        assertTrue(saved.getAssignedUserIds().isEmpty());
        assertNotNull(saved.getDocuments());
        assertTrue(saved.getDocuments().isEmpty());
        assertNotNull(saved.getUpdatedAt());

        verify(repo).save(any(Case.class));
    }

    @Test
    void createCase_invalidStatus_returnsBadRequest() {
        ResponseEntity<?> response = controller.createCase("Title", "Desc", "invalid");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("InvalidStatus", body.get("error"));
        assertTrue(body.get("message").toString().contains("Status must be one of"));
        verifyNoInteractions(repo);
    }

    @Test
    void createCase_onException_returnsBadRequestWithError() {
        when(repo.save(any(Case.class))).thenThrow(new RuntimeException("db error"));

        ResponseEntity<?> response = controller.createCase("Title", "Desc", "OPEN");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("RuntimeException", body.get("error"));
        assertEquals("db error", body.get("message"));
    }


    @Test
    void putCase_returnsNotFoundWhenCaseMissing() {
        when(repo.findById("123")).thenReturn(Optional.empty());

        ResponseEntity<Case> response = controller.putCase("123", new Case());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
        verify(repo, never()).save(any());
    }

    @Test
    void putCase_savesAndReturnsBodyWhenExists() {
        Case existing = new Case();
        when(repo.findById("123")).thenReturn(Optional.of(existing));

        Case body = new Case();
        body.setStatus("OPEN");
        when(repo.save(body)).thenReturn(body);

        ResponseEntity<Case> response = controller.putCase("123", body);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(body, response.getBody());
        verify(repo).save(body);
    }


    @Test
    void deleteCase_returnsNotFoundWhenMissing() {
        when(repo.existsById("123")).thenReturn(false);

        ResponseEntity<?> response = controller.deleteCase("123");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(repo, never()).deleteById(any());
    }

    @Test
    void deleteCase_deletesAndReturnsNoContentWhenExists() {
        when(repo.existsById("123")).thenReturn(true);

        ResponseEntity<?> response = controller.deleteCase("123");

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(repo).deleteById("123");
    }


    @Test
    void uploadDocument_returnsNotFoundWhenCaseMissing() throws IOException {
        when(repo.findById("123")).thenReturn(Optional.empty());
        MultipartFile file = mock(MultipartFile.class);

        ResponseEntity<String> response =
                controller.uploadDocument("123", file, "Alice");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Case not found", response.getBody());
        verify(repo, never()).save(any());
    }

    @Test
    void uploadDocument_addsDocumentAndSavesCase() throws IOException {
        Case theCase = new Case();
        theCase.setDocuments(new ArrayList<>());

        when(repo.findById("123")).thenReturn(Optional.of(theCase));
        when(repo.save(theCase)).thenReturn(theCase);

        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("doc.txt");
        when(file.getContentType()).thenReturn("text/plain");
        when(file.getBytes()).thenReturn("hello".getBytes());

        ResponseEntity<String> response =
                controller.uploadDocument("123", file, "Alice");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("File uploaded successfully"));
        assertEquals(1, theCase.getDocuments().size());
        FileDocument doc = theCase.getDocuments().get(0);
        assertEquals("doc.txt", doc.getFileName());
        assertEquals("text/plain", doc.getContentType());
        assertEquals("Alice", doc.getCreatedBy());
        assertNotNull(doc.getUploadedAt());
        assertArrayEquals("hello".getBytes(), doc.getData());
        assertNotNull(theCase.getUpdatedAt());
        verify(repo).save(theCase);
    }

    @Test
    void uploadDocument_onIOException_returnsInternalServerError() throws IOException {
        Case theCase = new Case();
        theCase.setDocuments(new ArrayList<>());
        when(repo.findById("123")).thenReturn(Optional.of(theCase));

        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("doc.txt");
        when(file.getContentType()).thenReturn("text/plain");
        when(file.getBytes()).thenThrow(new IOException("read error"));

        ResponseEntity<String> response =
                controller.uploadDocument("123", file, "Alice");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().contains("Failed to upload file"));
        verify(repo, never()).save(any());
    }


    @Test
    void getFileDocuments_returnsNotFoundWhenCaseMissing() {
        when(repo.findById("123")).thenReturn(Optional.empty());

        ResponseEntity<List<FileDocument>> response =
                controller.getFileDocuments("123");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void getFileDocuments_returnsEmptyListWhenDocsNull() {
        Case theCase = new Case();
        theCase.setDocuments(null);
        when(repo.findById("123")).thenReturn(Optional.of(theCase));

        ResponseEntity<List<FileDocument>> response =
                controller.getFileDocuments("123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void getFileDocuments_returnsDocsWhenPresent() {
        Case theCase = new Case();
        List<FileDocument> docs = new ArrayList<>();
        docs.add(new FileDocument());
        theCase.setDocuments(docs);
        when(repo.findById("123")).thenReturn(Optional.of(theCase));

        ResponseEntity<List<FileDocument>> response =
                controller.getFileDocuments("123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(docs, response.getBody());
    }


    @Test
    void downloadDocument_returnsNotFoundForMissingCaseOrInvalidIndex() {
        when(repo.findById("123")).thenReturn(Optional.empty());

        ResponseEntity<byte[]> response =
                controller.downloadDocument("123", 0);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void downloadDocument_returnsFileBytesAndHeadersWhenValid() {
        FileDocument doc = new FileDocument();
        doc.setFileName("doc.txt");
        doc.setContentType("text/plain");
        doc.setData("hello".getBytes());

        Case theCase = new Case();
        List<FileDocument> docs = new ArrayList<>();
        docs.add(doc);
        theCase.setDocuments(docs);

        when(repo.findById("123")).thenReturn(Optional.of(theCase));

        ResponseEntity<byte[]> response =
                controller.downloadDocument("123", 0);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertArrayEquals("hello".getBytes(), response.getBody());
        assertEquals("text/plain", response.getHeaders().getContentType().toString());
        String dispo = response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION);
        assertNotNull(dispo);
        assertTrue(dispo.contains("doc.txt"));
    }


    @Test
    void deleteDocument_returnsNotFoundWhenCaseOrIndexInvalid() {
        when(repo.findById("123")).thenReturn(Optional.empty());

        ResponseEntity<String> response =
                controller.deleteDocument("123", 0);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Case or document not found", response.getBody());
    }

    @Test
    void deleteDocument_removesDocumentAndSavesCase() {
        FileDocument doc = new FileDocument();
        Case theCase = new Case();
        List<FileDocument> docs = new ArrayList<>();
        docs.add(doc);
        theCase.setDocuments(docs);

        when(repo.findById("123")).thenReturn(Optional.of(theCase));
        when(repo.save(theCase)).thenReturn(theCase);

        ResponseEntity<String> response =
                controller.deleteDocument("123", 0);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Document deleted successfully", response.getBody());
        assertTrue(theCase.getDocuments().isEmpty());
        assertNotNull(theCase.getUpdatedAt());
        verify(repo).save(theCase);
    }


    @Test
    void getAllCases_returnsListFromRepo() {
        List<Case> list = List.of(new Case(), new Case());
        when(repo.findAll()).thenReturn(list);

        ResponseEntity<List<Case>> response = controller.getAllCases();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertSame(list, response.getBody());
        verify(repo).findAll();
    }
}
