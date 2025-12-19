package com.p3.Enevold.cases;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/admin/cases")
public class CaseControllerAdmin {

    @Autowired
    private CaseRepository repo;

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteCase(@RequestParam String caseId) {
        try {
            Optional<Case> opt = repo.findById(caseId);
            if (opt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Case not found"));
            }

            repo.deleteById(caseId);
            return ResponseEntity.ok(Map.of(
                    "message", "Case deleted successfully",
                    "caseId", caseId
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
