package com.p3.Enevold.clients;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.p3.Enevold.utils.FileDocument;

import java.util.List;
import java.io.IOException;
import java.util.Date;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/clients")
public class ClientController {

  @Autowired
  ClientRepository clientRepository;

  @PostMapping({"/create"})
  public ResponseEntity<Client> addClient(@RequestBody Client client) {
    // Ensure server manages id/createdAt
    client.setId(null);

    Client saved = clientRepository.save(client);

    return ResponseEntity.ok(saved);
  }

  @GetMapping("/getClients/{id}")
  public Client getClient(@PathVariable String id) {
    return clientRepository.findById(id).orElse(null);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Client> putClient(@PathVariable String id, @RequestBody Client body) {
  var existing = clientRepository.findById(id).orElse(null);
  if (existing == null) return ResponseEntity.notFound().build();


  var saved = clientRepository.save(body);
  return ResponseEntity.ok(saved);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteClient(@PathVariable String id) {
      if (!clientRepository.existsById(id)) {
          return ResponseEntity.notFound().build();
      }
      clientRepository.deleteById(id);
      return ResponseEntity.noContent().build();
  }

  // Upload a file/document to a specific client
  @PostMapping("/{clientId}/uploadDocument")
  public ResponseEntity<String> uploadDocument(
      @PathVariable String clientId,
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "createdBy", required = false) String createdBy) {

    try {
      // Find the client
      Client client = clientRepository.findById(clientId).orElse(null);
      if (client == null) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body("Client not found");
      }

      // Create a new FileDocument
      FileDocument document = new FileDocument();
      document.setFileName(file.getOriginalFilename());
      document.setContentType(file.getContentType());
      document.setData(file.getBytes());
      document.setUploadedAt(new Date());
      document.setCreatedBy(createdBy != null ? createdBy : "Unknown");

      // Add to client's documents list (init if null)
      if (client.getDocuments() == null)
        client.setDocuments(new java.util.ArrayList<>());
      client.getDocuments().add(document);

      // Save the client
      clientRepository.save(client);

      return ResponseEntity.ok("File uploaded successfully: " + file.getOriginalFilename());
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Failed to upload file: " + e.getMessage());
    }
  }

  // Get all documents for a specific client
  @GetMapping("/{clientId}/documents")
  public ResponseEntity<List<FileDocument>> getFileDocuments(@PathVariable String clientId) {
    Client client = clientRepository.findById(clientId).orElse(null);
    if (client == null) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }
    return ResponseEntity.ok(client.getDocuments());
  }

  // Download a specific document
  @GetMapping("/{clientId}/documents/{documentIndex}/download")
  public ResponseEntity<byte[]> downloadDocument(
      @PathVariable String clientId,
      @PathVariable int documentIndex) {

    Client client = clientRepository.findById(clientId).orElse(null);
    if (client == null || client.getDocuments() == null
        || documentIndex >= client.getDocuments().size()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }

    FileDocument document = client.getDocuments().get(documentIndex);

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(document.getContentType()))
        .header(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + document.getFileName() + "\"")
        .body(document.getData());
  }

  // Delete a specific document
  @DeleteMapping("/{clientId}/documents/{documentIndex}")
  public ResponseEntity<String> deleteDocument(
      @PathVariable String clientId,
      @PathVariable int documentIndex) {

    Client client = clientRepository.findById(clientId).orElse(null);
    if (client == null || client.getDocuments() == null
        || documentIndex >= client.getDocuments().size()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
          .body("Client or document not found");
    }

    client.getDocuments().remove(documentIndex);
    clientRepository.save(client);

    return ResponseEntity.ok("Document deleted successfully");
  }

  @GetMapping
  public List<Client> getAllClients() {
    return clientRepository.findAll();
  }
}
