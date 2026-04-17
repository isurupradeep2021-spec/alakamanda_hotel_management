package com.hotelmanagement.controller;

import com.hotelmanagement.dto.LeaveRequestDto;
import com.hotelmanagement.dto.UserDto;
import com.hotelmanagement.entity.AttendanceRecord;
import com.hotelmanagement.entity.LeaveRecord;
import com.hotelmanagement.entity.PayrollRecord;
import com.hotelmanagement.entity.PayslipRecord;
import com.hotelmanagement.entity.User;
import com.hotelmanagement.service.PayrollAutomationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffPayrollController {

    private final PayrollAutomationService payrollAutomationService;

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public UserDto profile() {
        User user = payrollAutomationService.getCurrentUser();
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

    @PostMapping("/attendance/check-in")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
    public AttendanceRecord checkIn() {
        return payrollAutomationService.checkIn(payrollAutomationService.getCurrentUser());
    }

    @PostMapping("/attendance/check-out")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
    public AttendanceRecord checkOut() {
        return payrollAutomationService.checkOut(payrollAutomationService.getCurrentUser());
    }

    @GetMapping("/attendance/summary")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public Map<String, Object> monthlySummary(@RequestParam(required = false) Integer month,
                                              @RequestParam(required = false) Integer year) {
        YearMonth ym = YearMonth.now();
        int m = month == null ? ym.getMonthValue() : month;
        int y = year == null ? ym.getYear() : year;
        return payrollAutomationService.getMonthlyAttendanceSummary(payrollAutomationService.getCurrentUser(), y, m);
    }

    @GetMapping("/attendance/history")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public List<AttendanceRecord> attendanceHistory(@RequestParam(required = false) Integer month,
                                                    @RequestParam(required = false) Integer year) {
        YearMonth ym = YearMonth.now();
        int m = month == null ? ym.getMonthValue() : month;
        int y = year == null ? ym.getYear() : year;
        return payrollAutomationService.getAttendanceHistory(payrollAutomationService.getCurrentUser(), y, m);
    }

    @PostMapping("/leave")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
    public LeaveRecord addLeave(@RequestBody LeaveRequestDto request) {
        LocalDate leaveDate = request.getLeaveDate() == null ? LocalDate.now() : request.getLeaveDate();
        return payrollAutomationService.requestLeave(payrollAutomationService.getCurrentUser(), leaveDate, request.getReason());
    }

    @GetMapping("/leave")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public List<LeaveRecord> leaveHistory(@RequestParam(required = false) Integer month,
                                          @RequestParam(required = false) Integer year) {
        YearMonth ym = YearMonth.now();
        int m = month == null ? ym.getMonthValue() : month;
        int y = year == null ? ym.getYear() : year;
        return payrollAutomationService.getLeaveHistory(payrollAutomationService.getCurrentUser(), y, m);
    }

    @GetMapping("/payroll/latest")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public PayrollRecord latestPayroll() {
        return payrollAutomationService.getLatestPayrollForUser(payrollAutomationService.getCurrentUser());
    }

    @GetMapping("/payslip/{payrollId}")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<byte[]> downloadPayslip(@PathVariable Long payrollId) {
        PayslipRecord payslip = payrollAutomationService.getPayslipByPayroll(payrollId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + payslip.getFileName())
                .body(payslip.getPdfData());
    }
}
