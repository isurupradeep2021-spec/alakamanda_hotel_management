package com.hotelmanagement.dto;

import com.hotelmanagement.entity.EmploymentStatus;
import com.hotelmanagement.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private String employeeId;
    private String employmentRole;
    private BigDecimal basicSalary;
    private LocalDate joinDate;
    private EmploymentStatus employmentStatus;
    private String phone;
}
