package com.hotelmanagement.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.hotelmanagement.config.RoleSerializer;
import com.hotelmanagement.entity.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String fullName;
    private String email;
    @JsonSerialize(using = RoleSerializer.class)
    private Role role;
    private String employeeId;
    private String employmentRole;
}
