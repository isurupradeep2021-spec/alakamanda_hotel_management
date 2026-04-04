package com.hotelmanagement.controller;

import com.hotelmanagement.entity.PayrollRecord;
import com.hotelmanagement.entity.PayrollPaymentStatus;
import com.hotelmanagement.entity.Role;
import com.hotelmanagement.entity.User;
import com.hotelmanagement.repository.PayrollRecordRepository;
import com.hotelmanagement.service.PayrollAuditService;
import com.hotelmanagement.service.PayrollAutomationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollRecordRepository repository;
    private final PayrollAutomationService payrollAutomationService;
    private final PayrollAuditService payrollAuditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public List<PayrollRecord> getAll(@RequestParam(required = false) String month,
                                      @RequestParam(required = false) String employee) {
        User currentUser = payrollAutomationService.getCurrentUser();

        List<PayrollRecord> rows;
        if (employee != null && !employee.isBlank()) {
            rows = repository.findByEmployeeNameContainingIgnoreCase(employee);
        } else if (month != null && !month.isBlank()) {
            rows = repository.findByPayrollMonth(month);
        } else {
            rows = repository.findAll();
        }

        if (currentUser.getRole() == Role.STAFF) {
            return rows.stream()
                    .filter(r -> belongsToCurrentStaff(currentUser, r))
                    .toList();
        }

        return rows;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollRecord create(@RequestBody PayrollRecord record) {
        if (record.getPayDate() == null) {
            record.setPayDate(LocalDate.now());
        }
        if (record.getGeneratedDate() == null) {
            record.setGeneratedDate(LocalDate.now());
        }
        if (record.getMonth() == null || record.getYear() == null) {
            if (record.getPayrollMonth() != null && record.getPayrollMonth().contains("-")) {
                String[] parts = record.getPayrollMonth().split("-");
                record.setYear(Integer.parseInt(parts[0]));
                record.setMonth(Integer.parseInt(parts[1]));
            } else {
                YearMonth ym = YearMonth.now();
                record.setMonth(ym.getMonthValue());
                record.setYear(ym.getYear());
            }
        }
        if (record.getPayrollMonth() == null || record.getPayrollMonth().isBlank()) {
            record.setPayrollMonth(String.format("%04d-%02d", record.getYear(), record.getMonth()));
        }
        if (record.getNetSalary() == null) {
            BigDecimal base = record.getBaseSalary() == null ? BigDecimal.ZERO : record.getBaseSalary();
            BigDecimal overtime = record.getOvertimePay() == null ? BigDecimal.ZERO : record.getOvertimePay();
            BigDecimal leaveDeduction = record.getLeaveDeduction() == null ? BigDecimal.ZERO : record.getLeaveDeduction();
            BigDecimal deductions = record.getDeductions() == null ? BigDecimal.ZERO : record.getDeductions();
            BigDecimal epf = record.getEpf() == null ? BigDecimal.ZERO : record.getEpf();
            BigDecimal tax = record.getTax() == null ? BigDecimal.ZERO : record.getTax();
            record.setNetSalary(base.add(overtime).subtract(leaveDeduction).subtract(deductions).subtract(epf).subtract(tax).setScale(2, RoundingMode.HALF_UP));
        }
        PayrollRecord saved = repository.save(record);
        payrollAuditService.log("PayrollRecord", saved.getId(), "CREATE", null, saved);
        return saved;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollRecord update(@PathVariable Long id, @RequestBody PayrollRecord payload) {
        PayrollRecord existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payroll record not found"));
        if (existing.isLocked()) {
            throw new IllegalArgumentException("Payroll record is locked after approval and cannot be edited");
        }
        PayrollRecord before = PayrollRecord.builder()
                .id(existing.getId())
                .employeeName(existing.getEmployeeName())
                .employeeId(existing.getEmployeeId())
                .department(existing.getDepartment())
                .employeeCode(existing.getEmployeeCode())
                .month(existing.getMonth())
                .year(existing.getYear())
                .payrollMonth(existing.getPayrollMonth())
                .workingDays(existing.getWorkingDays())
                .leaveDays(existing.getLeaveDays())
                .absentDays(existing.getAbsentDays())
                .lateDays(existing.getLateDays())
                .totalOvertimeHours(existing.getTotalOvertimeHours())
                .baseSalary(existing.getBaseSalary())
                .overtimeRate(existing.getOvertimeRate())
                .overtimePay(existing.getOvertimePay())
                .grossSalary(existing.getGrossSalary())
                .shiftAllowance(existing.getShiftAllowance())
                .leaveDeduction(existing.getLeaveDeduction())
                .deductions(existing.getDeductions())
                .insuranceDeduction(existing.getInsuranceDeduction())
                .loanRepayment(existing.getLoanRepayment())
                .carryForwardAmount(existing.getCarryForwardAmount())
                .epf(existing.getEpf())
                .tax(existing.getTax())
                .netSalary(existing.getNetSalary())
                .paymentStatus(existing.getPaymentStatus())
                .locked(existing.isLocked())
                .build();

        if (payload.getEmployeeName() != null) existing.setEmployeeName(payload.getEmployeeName());
        if (payload.getDepartment() != null) existing.setDepartment(payload.getDepartment());
        if (payload.getEmployeeCode() != null) existing.setEmployeeCode(payload.getEmployeeCode());
        if (payload.getWorkingDays() != null) existing.setWorkingDays(payload.getWorkingDays());
        if (payload.getAbsentDays() != null) existing.setAbsentDays(payload.getAbsentDays());
        if (payload.getTotalOvertimeHours() != null) existing.setTotalOvertimeHours(payload.getTotalOvertimeHours());
        if (payload.getBaseSalary() != null) existing.setBaseSalary(payload.getBaseSalary());
        if (payload.getOvertimeRate() != null) existing.setOvertimeRate(payload.getOvertimeRate());
        if (payload.getOvertimePay() != null) existing.setOvertimePay(payload.getOvertimePay());
        if (payload.getDeductions() != null) existing.setDeductions(payload.getDeductions());
        if (payload.getEpf() != null) existing.setEpf(payload.getEpf());
        if (payload.getTax() != null) existing.setTax(payload.getTax());
        if (payload.getNetSalary() != null) existing.setNetSalary(payload.getNetSalary());
        if (payload.getMonth() != null) existing.setMonth(payload.getMonth());
        if (payload.getYear() != null) existing.setYear(payload.getYear());
        if (payload.getPayrollMonth() != null) existing.setPayrollMonth(payload.getPayrollMonth());

        existing.setPaymentStatus(payload.getPaymentStatus() == null ? existing.getPaymentStatus() : payload.getPaymentStatus());
        existing.setNotes(payload.getNotes() == null ? existing.getNotes() : payload.getNotes());
        PayrollRecord saved = repository.save(existing);
        payrollAuditService.log("PayrollRecord", saved.getId(), "UPDATE", before, saved);
        return saved;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(@PathVariable Long id) {
        PayrollRecord existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payroll record not found"));
        if (existing.isLocked()) {
            throw new IllegalArgumentException("Payroll record is locked and cannot be deleted");
        }
        payrollAuditService.log("PayrollRecord", existing.getId(), "DELETE", existing, null);
        repository.deleteById(id);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public Map<String, Object> summary(@RequestParam(required = false) String month) {
        User currentUser = payrollAutomationService.getCurrentUser();

        List<PayrollRecord> rows = (month != null && !month.isBlank())
                ? repository.findByPayrollMonth(month)
                : repository.findAll();

        if (currentUser.getRole() == Role.STAFF) {
            rows = rows.stream().filter(r -> belongsToCurrentStaff(currentUser, r)).toList();
        }

        BigDecimal net = rows.stream()
                .map(r -> r.getNetSalary() == null ? BigDecimal.ZERO : r.getNetSalary())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "records", rows.size(),
                "netTotal", net.setScale(2, RoundingMode.HALF_UP)
        );
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public List<PayrollRecord> history(@RequestParam(required = false) LocalDate from,
                                       @RequestParam(required = false) LocalDate to,
                                       @RequestParam(required = false) Role role,
                                       @RequestParam(required = false) PayrollPaymentStatus status) {
        User currentUser = payrollAutomationService.getCurrentUser();
        List<PayrollRecord> rows = repository.findAll();

        if (from != null && to != null) {
            rows = rows.stream()
                    .filter(r -> r.getGeneratedDate() != null
                            && !r.getGeneratedDate().isBefore(from)
                            && !r.getGeneratedDate().isAfter(to))
                    .toList();
        }
        if (role != null) {
            rows = rows.stream()
                    .filter(r -> r.getUser() != null && r.getUser().getRole() == role)
                    .toList();
        }
        if (status != null) {
            rows = rows.stream().filter(r -> r.getPaymentStatus() == status).toList();
        }

        if (currentUser.getRole() == Role.STAFF) {
            rows = rows.stream().filter(r -> belongsToCurrentStaff(currentUser, r)).toList();
        }
        return rows;
    }

    private boolean belongsToCurrentStaff(User currentUser, PayrollRecord row) {
        if (row.getUser() != null && row.getUser().getId() != null) {
            return row.getUser().getId().equals(currentUser.getId());
        }
        return row.getEmployeeId() != null
                && currentUser.getEmployeeId() != null
                && row.getEmployeeId().equalsIgnoreCase(currentUser.getEmployeeId());
    }
}
