package com.hotelmanagement.controller;

import com.hotelmanagement.entity.PayrollPaymentStatus;
import com.hotelmanagement.entity.PayrollRecord;
import com.hotelmanagement.service.PayrollAutomationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll/automation")
@RequiredArgsConstructor
public class PayrollAutomationController {

    private final PayrollAutomationService payrollAutomationService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<PayrollRecord> generate(@RequestParam(required = false) Integer month,
                                        @RequestParam(required = false) Integer year) {
        YearMonth ym = YearMonth.now();
        int m = month == null ? ym.getMonthValue() : month;
        int y = year == null ? ym.getYear() : year;
        return payrollAutomationService.generatePayrollForMonth(y, m);
    }

    @GetMapping("/insights")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Map<String, Object> insights(@RequestParam(required = false) Integer month,
                                        @RequestParam(required = false) Integer year) {
        YearMonth ym = YearMonth.now();
        int m = month == null ? ym.getMonthValue() : month;
        int y = year == null ? ym.getYear() : year;
        return payrollAutomationService.adminPayrollInsights(y, m);
    }

    @PutMapping("/{payrollId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollRecord setStatus(@PathVariable Long payrollId,
                                   @RequestParam PayrollPaymentStatus status) {
        return payrollAutomationService.markPaymentStatus(payrollId, status);
    }
}
