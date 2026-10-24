package com.smartqueue.controller;

import com.smartqueue.dto.CreateTokenRequest;
import com.smartqueue.dto.UpdateStatusRequest;
import com.smartqueue.model.QueueToken;
import com.smartqueue.repository.QueueTokenRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class QueueTokenController {
    private final QueueTokenRepository repository;
    private static final Set<String> ALLOWED_STATUSES =
        Set.of("WAITING", "SERVING", "COMPLETED", "SKIPPED");

    public QueueTokenController(QueueTokenRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "application", "SmartQueue");
    }

    @GetMapping("/tokens")
    public List<QueueToken> getTodayTokens() {
        return repository.findByQueueDateOrderByIdAsc(LocalDate.now());
    }

    @PostMapping("/tokens")
    @ResponseStatus(HttpStatus.CREATED)
    public QueueToken createToken(@Valid @RequestBody CreateTokenRequest request) {
        LocalDate today = LocalDate.now();
        String name = request.getPatientName().trim();
        String department = request.getDepartment().trim();

        if (name.isEmpty() || department.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name and department are required");
        }

        long next = repository.countByQueueDateAndDepartment(today, department) + 1;
        QueueToken token = new QueueToken();
        token.setTokenNumber(String.format("%s-%03d", departmentPrefix(department), next));
        token.setPatientName(name);
        token.setDepartment(department);
        token.setQueueDate(today);
        token.setStatus("WAITING");
        return repository.save(token);
    }

    @PostMapping("/tokens/call-next")
    public Map<String, Object> callNext() {
        LocalDate today = LocalDate.now();

        // Only one token should be marked as serving at a time.
        repository.findFirstByQueueDateAndStatusOrderByIdAsc(today, "SERVING")
            .ifPresent(current -> {
                current.setStatus("COMPLETED");
                repository.save(current);
            });

        QueueToken next = repository.findFirstByQueueDateAndStatusOrderByIdAsc(today, "WAITING")
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No waiting patients"));

        next.setStatus("SERVING");
        repository.save(next);
        return Map.of("message", "Now calling " + next.getTokenNumber(), "token", next);
    }

    @PatchMapping("/tokens/{id}/status")
    public QueueToken updateStatus(@PathVariable Long id,
                                   @Valid @RequestBody UpdateStatusRequest request) {
        String status = request.getStatus().trim().toUpperCase();
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        }

        QueueToken token = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token not found"));

        if (!token.getQueueDate().equals(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only today's tokens can be updated");
        }
        token.setStatus(status);
        return repository.save(token);
    }

    private String departmentPrefix(String department) {
        String cleaned = department.replaceAll("[^A-Za-z]", "").toUpperCase();
        return cleaned.length() >= 2 ? cleaned.substring(0, 2) : "SQ";
    }
}
