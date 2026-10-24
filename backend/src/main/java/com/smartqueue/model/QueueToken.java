package com.smartqueue.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_tokens", indexes = {
    @Index(name = "idx_queue_date_department", columnList = "queueDate,department")
})
public class QueueToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String tokenNumber;

    @Column(nullable = false, length = 100)
    private String patientName;

    @Column(nullable = false, length = 80)
    private String department;

    @Column(nullable = false, length = 20)
    private String status = "WAITING";

    @Column(nullable = false)
    private LocalDate queueDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public QueueToken() {}

    @PrePersist
    public void beforeSave() {
        if (queueDate == null) queueDate = LocalDate.now();
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "WAITING";
    }

    public Long getId() { return id; }
    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getQueueDate() { return queueDate; }
    public void setQueueDate(LocalDate queueDate) { this.queueDate = queueDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
