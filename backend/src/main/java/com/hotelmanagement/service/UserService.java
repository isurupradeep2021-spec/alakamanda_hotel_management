package com.hotelmanagement.service;

import com.hotelmanagement.dto.CreateStaffRequest;
import com.hotelmanagement.dto.UpdateStaffRequest;
import com.hotelmanagement.dto.UserDto;

import java.util.List;

public interface UserService {
    List<UserDto> getAllUsers();
    UserDto getUserById(Long id);
    UserDto createStaff(CreateStaffRequest request);
    List<UserDto> getAllStaff();
    UserDto getStaffById(Long id);
    UserDto updateStaff(Long id, UpdateStaffRequest request);
    void deleteStaff(Long id);
}
