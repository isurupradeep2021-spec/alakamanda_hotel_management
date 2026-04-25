package com.hotelmanagement.controller;

import com.hotelmanagement.dto.CreateStaffRequest;
import com.hotelmanagement.dto.UpdateStaffRequest;
import com.hotelmanagement.dto.UserDto;
import com.hotelmanagement.entity.Role;
import com.hotelmanagement.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<UserDto> getAllStaff() {
        return userService.getAllStaff();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UserDto getStaffById(@PathVariable Long id) {
        return userService.getStaffById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UserDto createStaff(@Valid @RequestBody CreateStaffRequest request) {
        if (request.getRole() == null) {
            request.setRole(Role.STAFF);
        }
        return userService.createStaff(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UserDto updateStaff(@PathVariable Long id, @Valid @RequestBody UpdateStaffRequest request) {
        return userService.updateStaff(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void deleteStaff(@PathVariable Long id) {
        userService.deleteStaff(id);
    }
}
