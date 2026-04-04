package com.hotelmanagement.controller;

import com.hotelmanagement.dto.AttendanceAdjustmentRequest;
import com.hotelmanagement.entity.AttendanceRecord;
import com.hotelmanagement.entity.User;
import com.hotelmanagement.service.PayrollAutomationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final PayrollAutomationService payrollAutomationService;

    @PostMapping("/clock-in")
    @PreAuthorize("hasRole('STAFF')")
    public AttendanceRecord clockIn() {
        User user = payrollAutomationService.getCurrentUser();
        return payrollAutomationService.checkIn(user);
    }

    @PostMapping("/clock-out")
    @PreAuthorize("hasRole('STAFF')")
    public AttendanceRecord clockOut() {
        User user = payrollAutomationService.getCurrentUser();
        return payrollAutomationService.checkOut(user);
    }

    @PutMapping("/{attendanceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public AttendanceRecord adjustAttendance(@PathVariable Long attendanceId,
                                             @RequestBody AttendanceAdjustmentRequest request) {
        return payrollAutomationService.adjustAttendance(attendanceId, request);
    }

    @DeleteMapping("/{attendanceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void deleteAttendance(@PathVariable Long attendanceId) {
        payrollAutomationService.deleteAttendance(attendanceId);
    }

    @DeleteMapping("/overtime/{overtimeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void deleteOvertime(@PathVariable Long overtimeId) {
        payrollAutomationService.deleteOvertime(overtimeId);
    }
}
