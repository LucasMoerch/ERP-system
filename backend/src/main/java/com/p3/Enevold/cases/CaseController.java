package com.p3.Enevold.cases;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.p3.Enevold.utils.FileDocument;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/cases")
public class CaseController {

  @Autowired
  private CaseRepository repo;

  @PostMapping("/create")
  public ResponseEntity<?> createCase(@RequestParam String title,
      @RequestParam String description,
      @RequestParam String status) {
    try {
      List<String> allowedStatuses = List.of("OPEN", "ON_HOLD", "CLOSED");
      String normalizedStatus = status.toUpperCase();

      if (!allowedStatuses.contains(normalizedStatus)) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", "InvalidStatus",
            "message", "Status must be one of: OPEN, ON_HOLD, CLOSED"));
      }

      Case c = new Case();
      c.setTitle(title);
      c.setDescription(description);
      c.setStatus(normalizedStatus);
      c.setAssignedUserIds(new ArrayList<>());
      c.setDocuments(new ArrayList<>());

      Date now = Date.from(Instant.now());
      c.setUpdatedAt(now);

      Case saved = repo.save(c);
      return ResponseEntity.ok(saved);

    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.badRequest().body(Map.of(
          "error", e.getClass().getSimpleName(),
          "message", e.getMessage()));
    }
  }

  // Edit case details
  @PutMapping("/{id}")
    public ResponseEntity<Case> putCase(@PathVariable String id, @RequestBody Case body) {
    var existing = repo.findById(id).orElse(null);
    if (existing == null) return ResponseEntity.notFound().build();


    var saved = repo.save(body);
    return ResponseEntity.ok(saved);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteCase(@PathVariable String id) {
      if (!repo.existsById(id)) {
          return ResponseEntity.notFound().build();
      }
      repo.deleteById(id);
      return ResponseEntity.noContent().build();
  }


  // Upload a file/document to a specific case
  @PostMapping("/{caseId}/uploadDocument")
  public ResponseEntity<String> uploadDocument(@PathVariable String caseId,
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "createdBy", required = false) String createdBy) {
    try {
      Case theCase = repo.findById(caseId).orElse(null);
      if (theCase == null) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case not found");
      }

      FileDocument document = new FileDocument();
      document.setFileName(file.getOriginalFilename());
      document.setContentType(file.getContentType());
      document.setData(file.getBytes());
      document.setUploadedAt(new Date());
      document.setCreatedBy(createdBy != null ? createdBy : "Unknown");

      if (theCase.getDocuments() == null) {
        theCase.setDocuments(new ArrayList<>());
      }
      theCase.getDocuments().add(document);
      theCase.setUpdatedAt(new Date());

      repo.save(theCase);
      return ResponseEntity.ok("File uploaded successfully: " + file.getOriginalFilename());
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Failed to upload file: " + e.getMessage());
    }
  }

  // Get all documents for a specific case
  @GetMapping("/{caseId}/documents")
  public ResponseEntity<List<FileDocument>> getFileDocuments(@PathVariable String caseId) {
    Case theCase = repo.findById(caseId).orElse(null);
    if (theCase == null) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }
    List<FileDocument> docs = theCase.getDocuments();
    return ResponseEntity.ok(docs == null ? List.of() : docs);
  }

  // Download a specific document
  @GetMapping("/{caseId}/documents/{documentIndex}/download")
  public ResponseEntity<byte[]> downloadDocument(@PathVariable String caseId,
      @PathVariable int documentIndex) {
    Case theCase = repo.findById(caseId).orElse(null);
    if (theCase == null || theCase.getDocuments() == null
        || documentIndex < 0 || documentIndex >= theCase.getDocuments().size()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }

    FileDocument document = theCase.getDocuments().get(documentIndex);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(document.getContentType()))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
        .body(document.getData());
  }

  // Delete a specific document
  @DeleteMapping("/{caseId}/documents/{documentIndex}")
  public ResponseEntity<String> deleteDocument(@PathVariable String caseId,
      @PathVariable int documentIndex) {
    Case theCase = repo.findById(caseId).orElse(null);
    if (theCase == null || theCase.getDocuments() == null
        || documentIndex < 0 || documentIndex >= theCase.getDocuments().size()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Case or document not found");
    }

    theCase.getDocuments().remove(documentIndex);
    theCase.setUpdatedAt(new Date());
    repo.save(theCase);

    return ResponseEntity.ok("Document deleted successfully");
  }

  @GetMapping
  public ResponseEntity<List<Case>> getAllCases() {
    return ResponseEntity.ok(repo.findAll());
  }
}
