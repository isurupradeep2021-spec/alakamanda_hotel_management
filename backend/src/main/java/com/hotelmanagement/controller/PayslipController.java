package com.hotelmanagement.controller;

import com.hotelmanagement.entity.PayslipRecord;
import com.hotelmanagement.entity.PayrollRecord;
import com.hotelmanagement.entity.Role;
import com.hotelmanagement.entity.User;
import com.hotelmanagement.repository.PayrollRecordRepository;
import com.hotelmanagement.service.PayrollAutomationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payslip")
@RequiredArgsConstructor
public class PayslipController {

    private final PayrollAutomationService payrollAutomationService;
    private final PayrollRecordRepository payrollRecordRepository;

    @GetMapping("/{payrollId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<byte[]> downloadPayslip(@PathVariable Long payrollId) {
        User currentUser = payrollAutomationService.getCurrentUser();
        PayrollRecord payrollRecord = payrollRecordRepository.findById(payrollId)
                .orElseThrow(() -> new IllegalArgumentException("Payroll record not found"));

        if (currentUser.getRole() == Role.STAFF && !isOwnPayroll(currentUser, payrollRecord)) {
            throw new AccessDeniedException("You can only download your own payslip");
        }

        PayslipRecord payslip = payrollAutomationService.getPayslipByPayroll(payrollId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + payslip.getFileName())
                .body(payslip.getPdfData());
    }

    private boolean isOwnPayroll(User currentUser, PayrollRecord payrollRecord) {
        if (payrollRecord.getUser() != null && payrollRecord.getUser().getId() != null) {
            return payrollRecord.getUser().getId().equals(currentUser.getId());
        }
        return payrollRecord.getEmployeeId() != null
                && currentUser.getEmployeeId() != null
                && payrollRecord.getEmployeeId().equalsIgnoreCase(currentUser.getEmployeeId());
    }
}
