package com.hotelmanagement.controller;

import com.hotelmanagement.dto.CreateStaffRequest;
import com.hotelmanagement.dto.UserDto;
import jakarta.validation.Valid;
import com.hotelmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public UserDto getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PostMapping("/staff")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UserDto createStaff(@Valid @RequestBody CreateStaffRequest request) {
        return userService.createStaff(request);
    }
}
