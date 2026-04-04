package com.hotelmanagement.dto;

import com.hotelmanagement.entity.Role;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateStaffRequest {

    @NotBlank(message = "fullName is required")
    private String fullName;

    @Email(message = "email must be valid")
    @NotBlank(message = "email is required")
    private String email;

    @NotBlank(message = "password is required")
    private String password;

    @NotBlank(message = "employeeCode is required")
    private String employeeCode;

    @NotBlank(message = "department is required")
    private String department;

    // Must be STAFF for this endpoint.
    @NotNull(message = "role is required")
    private Role role;

    @NotNull(message = "baseSalary is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "baseSalary must be greater than zero")
    private BigDecimal baseSalary;
}
