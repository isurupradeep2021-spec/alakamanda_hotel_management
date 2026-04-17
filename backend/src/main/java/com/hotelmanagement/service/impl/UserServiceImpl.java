package com.hotelmanagement.service.impl;

import com.hotelmanagement.dto.UserDto;
import com.hotelmanagement.repository.UserRepository;
import com.hotelmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(user -> UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .employeeId(user.getEmployeeId())
                .employmentRole(user.getEmploymentRole())
                .basicSalary(user.getBasicSalary())
                .joinDate(user.getJoinDate())
                .employmentStatus(user.getEmploymentStatus())
                .phone(user.getPhone())
                .build()).toList();
    }

    @Override
    public UserDto getUserById(Long id) {
        var user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .employeeId(user.getEmployeeId())
                .employmentRole(user.getEmploymentRole())
                .basicSalary(user.getBasicSalary())
                .joinDate(user.getJoinDate())
                .employmentStatus(user.getEmploymentStatus())
                .phone(user.getPhone())
                .build();
    }
}
