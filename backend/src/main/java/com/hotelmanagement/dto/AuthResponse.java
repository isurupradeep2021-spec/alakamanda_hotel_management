package com.hotelmanagement.dto;

import com.hotelmanagement.entity.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String fullName;
    private String email;
    private Role role;
    private String employeeId;
    private String employmentRole;
}
