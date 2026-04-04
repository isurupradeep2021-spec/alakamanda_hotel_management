package com.hotelmanagement.controller;

import com.hotelmanagement.entity.PayrollAuditLog;
import com.hotelmanagement.service.PayrollAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/payroll/audit")
@RequiredArgsConstructor
public class PayrollAuditController {

    private final PayrollAuditService payrollAuditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<PayrollAuditLog> list(@RequestParam(required = false) LocalDateTime from,
                                      @RequestParam(required = false) LocalDateTime to) {
        return payrollAuditService.list(from, to);
    }
}
