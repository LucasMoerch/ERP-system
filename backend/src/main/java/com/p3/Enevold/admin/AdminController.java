package com.p3.Enevold.admin;

import com.p3.Enevold.users.User;
import com.p3.Enevold.users.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserRepository repo;

    // Allowed roles for invite
    private static final List<String> ALLOWED_ROLES = List.of("staff", "admin");

    public AdminController(UserRepository repo) {
        this.repo = repo;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/invite")
    public ResponseEntity<?> inviteNewUser(@RequestBody InvitationRequest request) {
        System.out.println("Inviting new user " + request);

        // Validate request
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "InvalidRequest", "message", "Email is required"));
        }

        try {
            String lowerEmail = request.getEmail().toLowerCase();

            // Filter roles against allowed list
            List<String> filteredRoles = new ArrayList<>();
            if (request.getRoles() != null) {
                for (String role : request.getRoles()) {
                    if (ALLOWED_ROLES.contains(role)) {
                        filteredRoles.add(role);
                    }
                }
            }

            // Find existing user by auth.email
            User user = repo.findByAuthEmail(lowerEmail).orElse(null);

            if (user == null) {
                // New invited user
                user = new User();
                user.setStatus("invited");

                User.Auth auth = new User.Auth();
                auth.setProvider("google");
                auth.setSub(null);
                auth.setEmail(lowerEmail);
                auth.setEmailVerified(false);
                auth.setPictureUrl(null);
                user.setAuth(auth);

                if (user.getProfile() == null) {
                    user.setProfile(new User.Profile());
                }

                User.Profile profile = user.getProfile();

                // Map extra fields from request
                profile.setFirstName(request.getFirstName());
                profile.setLastName(request.getLastName());
                profile.setDisplayName(request.getFullName());
                profile.setPhone(request.getPhone());
                profile.setAddress(request.getAddress());
                profile.setCPR(request.getCPR());

                if (!filteredRoles.isEmpty()) {
                    user.setRoles(filteredRoles);
                }


                } else { // send error if already invited
                    return ResponseEntity.status(409)
                            .body(Map.of("error", "UserAlreadyActive",
                                          "message", "User with email " + lowerEmail + " is already active."));

                }


            // Save via repository
            User saved = repo.save(user);
            return ResponseEntity.ok(saved);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "InvalidArgument", "message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("error", "InternalError", "message", e.getMessage()));
        }
    }
}
