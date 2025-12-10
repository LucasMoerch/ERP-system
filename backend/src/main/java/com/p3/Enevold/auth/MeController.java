package com.p3.Enevold.auth;

import com.p3.Enevold.users.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/me") // final url = /api/me
public class MeController {

    private final UserRepository repo;

    public MeController(UserRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<?> me(HttpSession session) {
        var uid = (String) session.getAttribute("uid");
        if (uid == null)
            return ResponseEntity.ok(Map.of("authenticated", false));

        var user = repo.findById(uid).orElse(null);
        if (user == null)
            return ResponseEntity.ok(Map.of("authenticated", false));

        // Return only safe fields
        var auth = user.getAuth();
        var profile = user.getProfile();
        var documents = user.getDocuments();

        Map<String, Object> response = new HashMap<>();
        response.put("firstName", profile != null ? profile.getFirstName() : "");
        response.put("lastName", profile != null ? profile.getLastName() : "");
        response.put("phone", profile != null ? profile.getPhone() : "");
        response.put("address", profile != null ? profile.getAddress() : "");
        response.put("authenticated", true);
        response.put("id", user.getId());
        response.put("email", auth != null ? auth.getEmail() : "");
        response.put("displayName", profile != null ? profile.getDisplayName() : "");
        response.put("roles", user.getRoles() != null ? user.getRoles() : List.of());
        response.put("status", user.getStatus() != null ? user.getStatus() : "unknown");
        response.put("pictureUrl", auth != null ? auth.getPictureUrl() : "");
        response.put("createdAt", user.getCreatedAt());
        response.put("updatedAt", user.getUpdatedAt());
        response.put("birthdate", profile != null ? profile.getBirthDate() : "");
        response.put("cpr", profile != null ? profile.getCPR() : "");
        response.put("documents", documents != null ? documents : List.of());
        response.put("bankReg", profile != null ? profile.getBankReg() : "");
        response.put("bankNumber", profile != null ? profile.getBankNumber() : "");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
