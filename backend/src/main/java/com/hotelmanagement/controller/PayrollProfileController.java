package com.hotelmanagement.controller;

import com.hotelmanagement.dto.PayrollProfileRequest;
import com.hotelmanagement.dto.PayrollProfileResponse;
import com.hotelmanagement.entity.ContractType;
import com.hotelmanagement.service.PayrollProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/payroll/profiles")
@RequiredArgsConstructor
public class PayrollProfileController {

    private final PayrollProfileService payrollProfileService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollProfileResponse create(@Valid @RequestBody PayrollProfileRequest request) {
        return payrollProfileService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<PayrollProfileResponse> list(@RequestParam(required = false) String employeeCode,
                                             @RequestParam(required = false) String name,
                                             @RequestParam(required = false) String department,
                                             @RequestParam(required = false) ContractType contractType) {
        return payrollProfileService.list(employeeCode, name, department, contractType);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollProfileResponse get(@PathVariable Long id) {
        return payrollProfileService.get(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollProfileResponse update(@PathVariable Long id, @Valid @RequestBody PayrollProfileRequest request) {
        return payrollProfileService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public PayrollProfileResponse archive(@PathVariable Long id) {
        return payrollProfileService.archive(id);
    }

    @PostMapping("/{id}/verify-bank")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollProfileResponse verifyBank(@PathVariable Long id,
                                             @RequestParam(defaultValue = "true") boolean verified) {
        return payrollProfileService.verifyBank(id, verified);
    }

    @PostMapping("/{id}/final-settlement")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollProfileResponse finalSettlement(@PathVariable Long id,
                                                  @RequestParam(required = false) BigDecimal carryForwardAmount) {
        return payrollProfileService.markFinalSettlement(id, carryForwardAmount);
    }
}
