package com.smartqueue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateTokenRequest {
    @NotBlank @Size(max = 100)
    private String patientName;

    @NotBlank @Size(max = 80)
    private String department;

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
