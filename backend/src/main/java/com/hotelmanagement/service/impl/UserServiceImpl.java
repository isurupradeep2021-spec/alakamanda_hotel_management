package com.hotelmanagement.service.impl;

import com.hotelmanagement.dto.CreateStaffRequest;
import com.hotelmanagement.dto.UpdateStaffRequest;
import com.hotelmanagement.dto.UserDto;
import com.hotelmanagement.entity.ContractType;
import com.hotelmanagement.entity.EmploymentStatus;
import com.hotelmanagement.entity.PayCycle;
import com.hotelmanagement.entity.PayrollProfile;
import com.hotelmanagement.entity.Role;
import com.hotelmanagement.entity.User;
import com.hotelmanagement.repository.PayrollProfileRepository;
import com.hotelmanagement.repository.UserRepository;
import com.hotelmanagement.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PayrollProfileRepository payrollProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toDto(user);
    }

    @Override
    public UserDto createStaff(CreateStaffRequest request) {
        if (request.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("Role must be STAFF for staff creation endpoint");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        userRepository.findByEmployeeId(request.getEmployeeCode())
                .ifPresent(x -> {
                    throw new IllegalArgumentException("Employee code already exists");
                });

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STAFF)
                .employeeId(request.getEmployeeCode())
                .employmentRole(request.getDepartment())
                .basicSalary(request.getBaseSalary())
                .joinDate(LocalDate.now())
                .employmentStatus(EmploymentStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        if (payrollProfileRepository.findByUser(user).isEmpty()) {
            PayrollProfile profile = PayrollProfile.builder()
                    .user(user)
                    .employeeCode(request.getEmployeeCode())
                    .employeeName(request.getFullName())
                    .contractType(ContractType.STAFF_MEMBER)
                    .department(request.getDepartment())
                    .payCycle(PayCycle.MONTHLY)
                    .baseSalary(request.getBaseSalary())
                    .active(true)
                    .archived(false)
                    .build();
            payrollProfileRepository.save(profile);
        }

        return toDto(user);
    }

    @Override
    public List<UserDto> getAllStaff() {
        return userRepository.findByRole(Role.STAFF).stream().map(this::toDto).toList();
    }

    @Override
    public UserDto getStaffById(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Staff member not found"));
        if (user.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("User is not a staff member");
        }
        return toDto(user);
    }

    @Override
    public UserDto updateStaff(Long id, UpdateStaffRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Staff member not found"));
        if (user.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("User is not a staff member");
        }

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new IllegalArgumentException("Email already exists");
        }
        userRepository.findByEmployeeId(request.getEmployeeCode())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Employee code already exists");
                });

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setEmployeeId(request.getEmployeeCode());
        user.setEmploymentRole(request.getDepartment());
        user.setBasicSalary(request.getBaseSalary());
        user.setPhone(request.getPhone());
        if (request.getEmploymentStatus() != null) {
            user.setEmploymentStatus(request.getEmploymentStatus());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User savedUser = userRepository.save(user);

        PayrollProfile profile = payrollProfileRepository.findByUser(savedUser)
                .orElseGet(() -> PayrollProfile.builder()
                        .user(savedUser)
                        .contractType(ContractType.STAFF_MEMBER)
                        .payCycle(PayCycle.MONTHLY)
                        .active(true)
                        .archived(false)
                        .build());

        profile.setEmployeeCode(request.getEmployeeCode());
        profile.setEmployeeName(request.getFullName());
        profile.setDepartment(request.getDepartment());
        profile.setBaseSalary(request.getBaseSalary());
        payrollProfileRepository.save(profile);

        return toDto(savedUser);
    }

    @Override
    public void deleteStaff(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Staff member not found"));
        if (user.getRole() != Role.STAFF) {
            throw new IllegalArgumentException("User is not a staff member");
        }

        try {
            payrollProfileRepository.deleteByUser(user);
            userRepository.delete(user);
        } catch (DataIntegrityViolationException ex) {
            // If historical references exist, gracefully deactivate instead of breaking.
            user.setEmploymentStatus(EmploymentStatus.TERMINATED);
            userRepository.save(user);
        }
    }

    private UserDto toDto(User user) {
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
