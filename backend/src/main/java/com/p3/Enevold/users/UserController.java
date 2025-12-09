
package com.p3.Enevold.users;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import com.p3.Enevold.utils.FileDocument;
import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import org.springframework.web.multipart.MultipartFile;

import com.p3.Enevold.utils.FileDocument;

import java.util.Date;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/users") // final path = /api/users
public class UserController {
    @Autowired
    UserRepository repo;
    private final JwtDecoder googleJwtDecoder;
    // Admin emails to grant admin role to from .env
    @Value("${app.admin-emails:}")
    private String adminEmails;

    public UserController(UserRepository repo, JwtDecoder googleJwtDecoder) { this.repo = repo;
        this.googleJwtDecoder = googleJwtDecoder;
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activate(@RequestParam("id_token") String idToken, jakarta.servlet.http.HttpSession session) {
       try {
           // Verify token with Google
           Jwt jwt = googleJwtDecoder.decode(idToken);

           // Extract claims
           String sub = jwt.getClaimAsString("sub");
           String email = jwt.getClaimAsString("email");
           Boolean emailVerified = jwt.getClaimAsBoolean("email_verified");
           String name = jwt.getClaimAsString("name");
           String picture = jwt.getClaimAsString("picture");

           if (email == null || sub == null) {
               return ResponseEntity.badRequest().body(java.util.Map.of("error","InvalidToken","message","Missing email/sub"));
           }
           var lowerEmail = email.toLowerCase();

           var user = repo.findByAuthEmail(lowerEmail).orElseThrow(() -> new IllegalStateException("Invite not found for email: " + lowerEmail));

           // If disabled, block it
           if ("disabled".equalsIgnoreCase(user.getStatus())) {
                       return ResponseEntity.status(403).body(
                           java.util.Map.of("error", "UserDisabled",
                                            "message", "This account has been disabled. Contact an administrator."));
                   }

           // If already active with a different sub, block it
           if (user.getAuth() != null && user.getAuth().getSub() != null && !user.getAuth().getSub().isBlank()) {
               if (!user.getAuth().getSub().equals(sub)) {
                   return ResponseEntity.status(409).body(
                           java.util.Map.of("error", "AlreadyLinked",
                                   "message", "User already activated with a different Google account.")
                   );
               }
           }
           // Update auth Fields
           var auth = user.getAuth();
           if (auth == null){
               auth = new User.Auth();
           }
           auth.setProvider("google");
           auth.setSub(sub);
           auth.setEmail(lowerEmail);
           auth.setEmailVerified(emailVerified);
           if (picture != null) { auth.setPictureUrl(picture); }
           user.setAuth(auth);

           // Flip status to active
           user.setStatus("active");

           if (adminEmails.contains(lowerEmail)) {
               user.setRoles(java.util.List.of("admin","staff"));
           }

           var saved = repo.save(user);
           session.setAttribute("uid", saved.getId());
           return ResponseEntity.ok(saved);
       } catch(Exception e) {
           return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getClass().getSimpleName(), "message", e.getMessage()));
       }

    }

    // Edit user details (only by admin)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
      public ResponseEntity<User> putUser(@PathVariable String id, @RequestBody User body) {
      var existing = repo.findById(id).orElse(null);
      if (existing == null) return ResponseEntity.notFound().build();


      var saved = repo.save(body);
      return ResponseEntity.ok(saved);
    }

    // Update own profile details
    public record SelfProfileUpdateRequest(
        String firstName,
        String lastName,
        String displayName,
        String phone,
        String address,
        String cpr
    ) {}

    @PreAuthorize("#id == principal.userId")
    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable String id,
                                           @RequestBody SelfProfileUpdateRequest req) {
        var user = repo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        if (user.getProfile() == null) user.setProfile(new User.Profile());
        var p = user.getProfile();
        p.setFirstName(req.firstName());
        p.setLastName(req.lastName());
        p.setDisplayName(req.displayName());
        p.setPhone(req.phone());
        p.setAddress(req.address());
        p.setCPR(req.cpr());

        return ResponseEntity.ok(repo.save(user));
    }


    // Delete user (only by admin)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }


    // Upload a file/document to a specific user
    @PostMapping("/{userId}/uploadDocument")
    public ResponseEntity<String> uploadDocument(
        @PathVariable String userId,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "createdBy", required = false) String createdBy) {
      try {
        User u = repo.findById(userId).orElse(null);
        if (u == null) {
          return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        FileDocument document = new FileDocument();
        document.setFileName(file.getOriginalFilename());
        document.setContentType(file.getContentType());
        document.setData(file.getBytes());
        document.setUploadedAt(new Date());
        document.setCreatedBy(createdBy != null ? createdBy : "Unknown");

        if (u.getDocuments() == null) {
          u.setDocuments(new ArrayList<>());
        }
        u.getDocuments().add(document);

        repo.save(u);
        return ResponseEntity.ok("File uploaded successfully: " + file.getOriginalFilename());
      } catch (IOException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body("Failed to upload file: " + e.getMessage());
      }
    }

    // Get all documents for a specific user
    @GetMapping("/{userId}/documents")
    public ResponseEntity<List<FileDocument>> getFileDocuments(@PathVariable String userId) {
      User u = repo.findById(userId).orElse(null);
      if (u == null) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
      }
      List<FileDocument> docs = u.getDocuments();
      return ResponseEntity.ok(docs == null ? List.of() : docs);
    }

    // Download a specific document
    @GetMapping("/{userId}/documents/{documentIndex}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable String userId,
        @PathVariable int documentIndex) {
      User u = repo.findById(userId).orElse(null);
      if (u == null || u.getDocuments() == null
          || documentIndex < 0 || documentIndex >= u.getDocuments().size()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
      }

      FileDocument document = u.getDocuments().get(documentIndex);
      return ResponseEntity.ok()
          .contentType(MediaType.parseMediaType(document.getContentType()))
          .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
          .body(document.getData());
    }

    // Delete a specific document
    @DeleteMapping("/{userId}/documents/{documentIndex}")
    public ResponseEntity<String> deleteDocument(@PathVariable String userId,
        @PathVariable int documentIndex) {
      User u = repo.findById(userId).orElse(null);
      if (u == null || u.getDocuments() == null
          || documentIndex < 0 || documentIndex >= u.getDocuments().size()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User or document not found");
      }

      u.getDocuments().remove(documentIndex);
      repo.save(u);

      return ResponseEntity.ok("Document deleted successfully");
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> all() { return ResponseEntity.ok(repo.findAll()); }
}
