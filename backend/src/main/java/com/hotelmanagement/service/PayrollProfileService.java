package com.hotelmanagement.service;

import com.hotelmanagement.dto.PayrollProfileRequest;
import com.hotelmanagement.dto.PayrollProfileResponse;
import com.hotelmanagement.entity.*;
import com.hotelmanagement.repository.PayrollProfileRepository;
import com.hotelmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PayrollProfileService {

    private final PayrollProfileRepository payrollProfileRepository;
    private final UserRepository userRepository;
    private final PayrollAuditService payrollAuditService;

    public PayrollProfileResponse create(PayrollProfileRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        payrollProfileRepository.findByEmployeeCode(request.getEmployeeCode())
                .ifPresent(x -> {
                    throw new IllegalArgumentException("Employee code already exists in payroll profiles");
                });

        PayrollProfile profile = new PayrollProfile();
        applyRequest(profile, request, user);
        profile.setArchived(false);
        profile.setActive(true);
        profile.setFinalSettlementCalculated(false);
        profile.setJoinDate(Optional.ofNullable(user.getJoinDate()).orElse(LocalDate.now()));

        profile = payrollProfileRepository.save(profile);
        payrollAuditService.log("PayrollProfile", profile.getId(), "CREATE", null, profile);
        return toResponse(profile, isAdminViewer());
    }

    public PayrollProfileResponse update(Long id, PayrollProfileRequest request) {
        PayrollProfile profile = payrollProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payroll profile not found"));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        payrollProfileRepository.findByEmployeeCode(request.getEmployeeCode())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(x -> {
                    throw new IllegalArgumentException("Employee code already exists in payroll profiles");
                });

        PayrollProfile before = cloneForAudit(profile);
        applyRequest(profile, request, user);
        profile = payrollProfileRepository.save(profile);

        payrollAuditService.log("PayrollProfile", profile.getId(), "UPDATE", before, profile);
        return toResponse(profile, isAdminViewer());
    }

    public PayrollProfileResponse get(Long id) {
        PayrollProfile profile = payrollProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payroll profile not found"));
        return toResponse(profile, isAdminViewer());
    }

    public List<PayrollProfileResponse> list(String employeeCode, String name, String department, ContractType contractType) {
        List<PayrollProfile> rows = payrollProfileRepository.findAll().stream()
                .filter(p -> !p.isArchived())
                .toList();

        if (employeeCode != null && !employeeCode.isBlank()) {
            rows = rows.stream()
                    .filter(p -> p.getEmployeeCode() != null && p.getEmployeeCode().equalsIgnoreCase(employeeCode))
                    .toList();
        }
        if (name != null && !name.isBlank()) {
            rows = rows.stream()
                    .filter(p -> p.getEmployeeName() != null && p.getEmployeeName().toLowerCase().contains(name.toLowerCase()))
                    .toList();
        }
        if (department != null && !department.isBlank()) {
            rows = rows.stream()
                    .filter(p -> p.getDepartment() != null && p.getDepartment().toLowerCase().contains(department.toLowerCase()))
                    .toList();
        }
        if (contractType != null) {
            rows = rows.stream().filter(p -> p.getContractType() == contractType).toList();
        }

        boolean showSensitive = isAdminViewer();
        return rows.stream().map(p -> toResponse(p, showSensitive)).toList();
    }

    public PayrollProfileResponse archive(Long id) {
        PayrollProfile profile = payrollProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payroll profile not found"));

        if (!profile.isFinalSettlementCalculated()) {
            throw new IllegalArgumentException("Final settlement must be completed before profile archival");
        }

        PayrollProfile before = cloneForAudit(profile);
        profile.setArchived(true);
        profile.setActive(false);
        profile.setArchivedDate(LocalDate.now());

        User user = profile.getUser();
        if (user != null) {
            user.setEmploymentStatus(EmploymentStatus.TERMINATED);
            userRepository.save(user);
        }

        profile = payrollProfileRepository.save(profile);
        payrollAuditService.log("PayrollProfile", profile.getId(), "ARCHIVE", before, profile);
        return toResponse(profile, isAdminViewer());
    }

    public PayrollProfileResponse markFinalSettlement(Long id, BigDecimal carryForward) {
        PayrollProfile profile = payrollProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payroll profile not found"));
        PayrollProfile before = cloneForAudit(profile);
        profile.setFinalSettlementCalculated(true);
        profile.setCarryForwardAmount(Optional.ofNullable(carryForward).orElse(BigDecimal.ZERO));
        profile = payrollProfileRepository.save(profile);
        payrollAuditService.log("PayrollProfile", profile.getId(), "FINAL_SETTLEMENT", before, profile);
        return toResponse(profile, isAdminViewer());
    }

    public PayrollProfileResponse verifyBank(Long id, boolean verified) {
        PayrollProfile profile = payrollProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payroll profile not found"));
        PayrollProfile before = cloneForAudit(profile);
        profile.setBankVerified(verified);
        profile = payrollProfileRepository.save(profile);
        payrollAuditService.log("PayrollProfile", profile.getId(), "VERIFY_BANK", before, profile);
        return toResponse(profile, isAdminViewer());
    }

    public Optional<PayrollProfile> findActiveProfileByUser(User user) {
        return payrollProfileRepository.findByUser(user)
                .filter(p -> p.isActive() && !p.isArchived());
    }

    public List<PayrollProfile> findActiveProfiles(PayCycle payCycle) {
        return payrollProfileRepository.findByArchivedFalseAndActiveTrueAndPayCycle(payCycle);
    }

    public List<PayrollProfile> findAllActiveProfiles() {
        return payrollProfileRepository.findByArchivedFalseAndActiveTrue();
    }

    private void applyRequest(PayrollProfile profile, PayrollProfileRequest request, User user) {
        profile.setUser(user);
        profile.setEmployeeCode(request.getEmployeeCode());
        profile.setEmployeeName(request.getEmployeeName());
        profile.setContractType(request.getContractType());
        profile.setDepartment(request.getDepartment());
        profile.setPayCycle(request.getPayCycle());
        profile.setBaseSalary(Optional.ofNullable(request.getBaseSalary()).orElse(BigDecimal.ZERO));
        profile.setHourlyRate(request.getHourlyRate());
        profile.setDailyRate(request.getDailyRate());
        profile.setHousingAllowance(Optional.ofNullable(request.getHousingAllowance()).orElse(BigDecimal.ZERO));
        profile.setTransportAllowance(Optional.ofNullable(request.getTransportAllowance()).orElse(BigDecimal.ZERO));
        profile.setMealAllowance(Optional.ofNullable(request.getMealAllowance()).orElse(BigDecimal.ZERO));
        profile.setShiftAllowancePerShift(Optional.ofNullable(request.getShiftAllowancePerShift()).orElse(BigDecimal.ZERO));
        profile.setPerformanceBonus(Optional.ofNullable(request.getPerformanceBonus()).orElse(BigDecimal.ZERO));
        profile.setTaxRate(Optional.ofNullable(request.getTaxRate()).orElse(BigDecimal.ZERO));
        profile.setInsuranceRate(Optional.ofNullable(request.getInsuranceRate()).orElse(BigDecimal.ZERO));
        profile.setLoanRepayment(Optional.ofNullable(request.getLoanRepayment()).orElse(BigDecimal.ZERO));
        profile.setOvertimeMultiplier(Optional.ofNullable(request.getOvertimeMultiplier()).orElse(new BigDecimal("1.5")));
        profile.setCarryForwardAmount(Optional.ofNullable(request.getCarryForwardAmount()).orElse(BigDecimal.ZERO));
        profile.setBankName(request.getBankName());
        profile.setBankAccountNumber(request.getBankAccountNumber());
        profile.setPaymentMethod(request.getPaymentMethod());
        profile.setTaxId(request.getTaxId());

        mapContractToUserRole(user, request.getContractType());
        user.setEmployeeId(request.getEmployeeCode());
        user.setFullName(request.getEmployeeName());
        user.setEmploymentRole(request.getDepartment());
        if (request.getContractType() != ContractType.STAFF_MEMBER) {
            user.setBasicSalary(profile.getBaseSalary());
        }
        userRepository.save(user);
    }

    private void mapContractToUserRole(User user, ContractType contractType) {
        if (contractType == ContractType.MANAGER) {
            user.setRole(Role.MANAGER);
        } else if (contractType == ContractType.ADMIN) {
            user.setRole(Role.ADMIN);
        } else {
            user.setRole(Role.STAFF);
        }
    }

    private boolean isAdminViewer() {
        String role = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .map(a -> a.getAuthority())
                .findFirst()
                .orElse("");
        return role.equals("ROLE_ADMIN");
    }

    private PayrollProfile cloneForAudit(PayrollProfile p) {
        return PayrollProfile.builder()
                .id(p.getId())
                .employeeCode(p.getEmployeeCode())
                .employeeName(p.getEmployeeName())
                .contractType(p.getContractType())
                .department(p.getDepartment())
                .payCycle(p.getPayCycle())
                .baseSalary(p.getBaseSalary())
                .hourlyRate(p.getHourlyRate())
                .dailyRate(p.getDailyRate())
                .housingAllowance(p.getHousingAllowance())
                .transportAllowance(p.getTransportAllowance())
                .mealAllowance(p.getMealAllowance())
                .shiftAllowancePerShift(p.getShiftAllowancePerShift())
                .performanceBonus(p.getPerformanceBonus())
                .taxRate(p.getTaxRate())
                .insuranceRate(p.getInsuranceRate())
                .loanRepayment(p.getLoanRepayment())
                .overtimeMultiplier(p.getOvertimeMultiplier())
                .carryForwardAmount(p.getCarryForwardAmount())
                .bankName(p.getBankName())
                .bankAccountNumber(p.getBankAccountNumber())
                .paymentMethod(p.getPaymentMethod())
                .taxId(p.getTaxId())
                .bankVerified(p.isBankVerified())
                .active(p.isActive())
                .archived(p.isArchived())
                .finalSettlementCalculated(p.isFinalSettlementCalculated())
                .joinDate(p.getJoinDate())
                .build();
    }

    private PayrollProfileResponse toResponse(PayrollProfile profile, boolean showSensitive) {
        return PayrollProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser() == null ? null : profile.getUser().getId())
                .employeeCode(profile.getEmployeeCode())
                .employeeName(profile.getEmployeeName())
                .email(profile.getUser() == null ? null : profile.getUser().getEmail())
                .contractType(profile.getContractType())
                .department(profile.getDepartment())
                .payCycle(profile.getPayCycle())
                .baseSalary(profile.getBaseSalary())
                .hourlyRate(profile.getHourlyRate())
                .dailyRate(profile.getDailyRate())
                .housingAllowance(profile.getHousingAllowance())
                .transportAllowance(profile.getTransportAllowance())
                .mealAllowance(profile.getMealAllowance())
                .shiftAllowancePerShift(profile.getShiftAllowancePerShift())
                .performanceBonus(profile.getPerformanceBonus())
                .taxRate(profile.getTaxRate())
                .insuranceRate(profile.getInsuranceRate())
                .loanRepayment(profile.getLoanRepayment())
                .overtimeMultiplier(profile.getOvertimeMultiplier())
                .carryForwardAmount(profile.getCarryForwardAmount())
                .bankName(showSensitive ? profile.getBankName() : maskBankName(profile.getBankName()))
                .bankAccountNumber(showSensitive ? profile.getBankAccountNumber() : maskBankAccount(profile.getBankAccountNumber()))
                .paymentMethod(profile.getPaymentMethod())
                .taxId(showSensitive ? profile.getTaxId() : maskTaxId(profile.getTaxId()))
                .bankVerified(profile.isBankVerified())
                .active(profile.isActive())
                .archived(profile.isArchived())
                .finalSettlementCalculated(profile.isFinalSettlementCalculated())
                .joinDate(profile.getJoinDate())
                .build();
    }

    private String maskBankName(String value) {
        if (value == null || value.isBlank()) return value;
        return value.charAt(0) + "***";
    }

    private String maskBankAccount(String value) {
        if (value == null || value.length() < 4) return "****";
        return "****" + value.substring(value.length() - 4);
    }

    private String maskTaxId(String value) {
        if (value == null || value.length() < 4) return "****";
        return "****" + value.substring(value.length() - 4);
    }
}
