package com.hotelmanagement.dto;

import com.hotelmanagement.entity.EmploymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateStaffRequest {

    @NotBlank(message = "fullName is required")
    private String fullName;

    @Email(message = "email must be valid")
    @NotBlank(message = "email is required")
    private String email;

    // Optional for update. If set, password will be updated.
    private String password;

    @NotBlank(message = "employeeCode is required")
    private String employeeCode;

    @NotBlank(message = "department is required")
    private String department;

    @NotNull(message = "baseSalary is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "baseSalary must be greater than zero")
    private BigDecimal baseSalary;

    private String phone;

    private EmploymentStatus employmentStatus;
}
