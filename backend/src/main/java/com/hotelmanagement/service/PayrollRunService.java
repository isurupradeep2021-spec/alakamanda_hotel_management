package com.hotelmanagement.service;

import com.hotelmanagement.dto.PayrollRunRequest;
import com.hotelmanagement.entity.*;
import com.hotelmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.WeekFields;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PayrollRunService {

    private final PayrollRunRepository payrollRunRepository;
    private final PayrollProfileService payrollProfileService;
    private final PayrollProfileRepository payrollProfileRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final LeaveRecordRepository leaveRecordRepository;
    private final PayrollAuditService payrollAuditService;
    private final PayrollAutomationService payrollAutomationService;

    @Value("${app.payroll.max-paid-leaves:5}")
    private int maxPaidLeaves;

    @Value("${app.payroll.default-tax-manager:0.18}")
    private BigDecimal defaultManagerTaxRate;

    @Value("${app.payroll.default-tax-admin:0.12}")
    private BigDecimal defaultAdminTaxRate;

    @Value("${app.payroll.default-tax-staff:0.08}")
    private BigDecimal defaultStaffTaxRate;

    @Value("${app.payroll.default-insurance-rate:0.03}")
    private BigDecimal defaultInsuranceRate;

    @Value("${app.payroll.max-overtime-hours-per-week:20}")
    private double legalMaxWeeklyOvertimeHours;

    @Value("${app.payroll.schedule.monthly-day:28}")
    private int monthlyRunDay;

    @Value("${app.payroll.schedule.weekly-day:FRIDAY}")
    private String weeklyRunDay;

    @Value("${app.payroll.schedule.reminder-days-before:2}")
    private int reminderDaysBefore;

    public PayrollRun createDraftRun(PayrollRunRequest request) {
        PayrollRun existing = null;
        if (request.getPayCycle() == PayCycle.MONTHLY) {
            existing = payrollRunRepository.findByYearAndMonthAndPayCycle(request.getYear(), request.getMonth(), request.getPayCycle()).orElse(null);
        } else {
            LocalDate dueDate = dueDateForCycle(request.getYear(), request.getMonth(), request.getPayCycle());
            existing = payrollRunRepository.findByPayCycleAndScheduledDate(request.getPayCycle(), dueDate).orElse(null);
        }
        if (existing != null) {
            throw new IllegalArgumentException("Payroll run already exists for selected period/cycle");
        }

        YearMonth ym = YearMonth.of(request.getYear(), request.getMonth());
        PayrollRun run = PayrollRun.builder()
                .year(request.getYear())
                .month(request.getMonth())
                .periodStart(ym.atDay(1))
                .periodEnd(ym.atEndOfMonth())
                .scheduledDate(dueDateForCycle(request.getYear(), request.getMonth(), request.getPayCycle()))
                .payCycle(request.getPayCycle())
                .status(PayrollRunStatus.DRAFT)
                .locked(false)
                .createdBy(currentActor())
                .notes(request.getNotes())
                .build();
        run = payrollRunRepository.save(run);

        List<PayrollProfile> profiles = payrollProfileService.findActiveProfiles(request.getPayCycle());
        List<PayrollRecord> records = new ArrayList<>();
        for (PayrollProfile profile : profiles) {
            records.add(generateRecordForProfile(profile, request.getYear(), request.getMonth(), run));
        }

        run.setRecordCount(records.size());
        run.setTotalNetAmount(records.stream()
                .map(r -> safe(r.getNetSalary()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP));
        run = payrollRunRepository.save(run);

        payrollAuditService.log("PayrollRun", run.getId(), "CREATE_DRAFT_RUN", null, run);
        return run;
    }

    public List<PayrollRun> listRuns(PayrollRunStatus status) {
        if (status == null) return payrollRunRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
        return payrollRunRepository.findByStatus(status);
    }

    public PayrollRun getRun(Long runId) {
        return payrollRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Payroll run not found"));
    }

    public PayrollRun moveToManagerReview(Long runId, String note) {
        PayrollRun run = getRun(runId);
        if (run.getStatus() != PayrollRunStatus.DRAFT) {
            throw new IllegalArgumentException("Only draft payroll run can be sent for manager review");
        }
        PayrollRun before = copyRun(run);
        run.setStatus(PayrollRunStatus.MANAGER_REVIEW);
        run.setManagerReviewedBy(currentActor());
        run.setManagerReviewedAt(LocalDateTime.now());
        if (note != null && !note.isBlank()) {
            run.setNotes(note);
        }
        run = payrollRunRepository.save(run);
        payrollAuditService.log("PayrollRun", run.getId(), "MANAGER_REVIEW", before, run);
        return run;
    }

    public PayrollRun approveByAdmin(Long runId, String note) {
        PayrollRun run = getRun(runId);
        if (run.getStatus() != PayrollRunStatus.MANAGER_REVIEW) {
            throw new IllegalArgumentException("Run must be in manager review stage before admin approval");
        }
        List<PayrollRecord> records = payrollRecordRepository.findByPayrollRun(run);
        for (PayrollRecord record : records) {
            record.setLocked(true);
            payrollRecordRepository.save(record);
        }
        PayrollRun before = copyRun(run);
        run.setStatus(PayrollRunStatus.ADMIN_APPROVED);
        run.setAdminApprovedBy(currentActor());
        run.setAdminApprovedAt(LocalDateTime.now());
        run.setLocked(true);
        if (note != null && !note.isBlank()) {
            run.setNotes(note);
        }
        run = payrollRunRepository.save(run);
        payrollAuditService.log("PayrollRun", run.getId(), "ADMIN_APPROVE", before, run);
        return run;
    }

    public PayrollRun releaseByFinance(Long runId, String note) {
        PayrollRun run = getRun(runId);
        if (run.getStatus() != PayrollRunStatus.ADMIN_APPROVED) {
            throw new IllegalArgumentException("Run must be admin approved before finance release");
        }

        List<PayrollRecord> records = payrollRecordRepository.findByPayrollRun(run);
        for (PayrollRecord record : records) {
            PayrollProfile profile = payrollProfileRepository.findByUser(record.getUser()).orElse(null);
            if (profile != null && !profile.isBankVerified()) {
                throw new IllegalArgumentException("Bank details must be verified before disbursement for employee " + profile.getEmployeeCode());
            }
        }

        for (PayrollRecord record : records) {
            record.setPaymentStatus(PayrollPaymentStatus.PAID);
            record.setLocked(true);
            payrollRecordRepository.save(record);
            payrollAutomationService.getPayslipByPayroll(record.getId());
        }

        PayrollRun before = copyRun(run);
        run.setStatus(PayrollRunStatus.FINANCE_RELEASED);
        run.setFinanceReleasedBy(currentActor());
        run.setFinanceReleasedAt(LocalDateTime.now());
        run.setLocked(true);
        if (note != null && !note.isBlank()) {
            run.setNotes(note);
        }
        run = payrollRunRepository.save(run);
        payrollAuditService.log("PayrollRun", run.getId(), "FINANCE_RELEASE", before, run);
        return run;
    }

    public void deleteRun(Long runId) {
        PayrollRun run = getRun(runId);
        if (run.getStatus() == PayrollRunStatus.ADMIN_APPROVED || run.getStatus() == PayrollRunStatus.FINANCE_RELEASED) {
            throw new IllegalArgumentException("No payroll run can be deleted after it has been approved");
        }

        List<PayrollRecord> records = payrollRecordRepository.findByPayrollRun(run);
        records.forEach(r -> payrollAuditService.log("PayrollRecord", r.getId(), "DELETE_BY_RUN", r, null));
        payrollRecordRepository.deleteAll(records);
        payrollAuditService.log("PayrollRun", run.getId(), "DELETE", run, null);
        payrollRunRepository.delete(run);
    }

    public Map<String, Object> dashboard() {
        LocalDate today = LocalDate.now();
        YearMonth ym = YearMonth.now();

        BigDecimal totalCost = payrollRecordRepository.findByMonthAndYear(ym.getMonthValue(), ym.getYear()).stream()
                .map(r -> safe(r.getNetSalary()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        long pendingPayments = payrollRecordRepository.findAll().stream()
                .filter(r -> r.getPaymentStatus() == PayrollPaymentStatus.UNPAID)
                .count();

        List<PayrollRun> upcoming = payrollRunRepository.findByScheduledDateBetween(today, today.plusDays(7)).stream()
                .filter(r -> r.getStatus() != PayrollRunStatus.FINANCE_RELEASED && r.getStatus() != PayrollRunStatus.CANCELLED)
                .toList();

        return Map.of(
                "totalPayrollCost", totalCost,
                "pendingPayments", pendingPayments,
                "upcomingDisbursements", upcoming.size(),
                "upcomingRuns", upcoming
        );
    }

    public Map<String, Object> monthlySummary(Integer year, Integer month) {
        List<PayrollRecord> records = payrollRecordRepository.findByMonthAndYear(month, year);

        Map<String, BigDecimal> byDepartment = new HashMap<>();
        Map<String, BigDecimal> byContractType = new HashMap<>();

        for (PayrollRecord record : records) {
            PayrollProfile profile = payrollProfileRepository.findByUser(record.getUser()).orElse(null);
            String department = profile == null ? "UNKNOWN" : Optional.ofNullable(profile.getDepartment()).orElse("UNKNOWN");
            String contract = profile == null ? "UNKNOWN" : profile.getContractType().name();

            byDepartment.put(department, byDepartment.getOrDefault(department, BigDecimal.ZERO).add(safe(record.getNetSalary())));
            byContractType.put(contract, byContractType.getOrDefault(contract, BigDecimal.ZERO).add(safe(record.getNetSalary())));
        }

        return Map.of(
                "year", year,
                "month", month,
                "recordCount", records.size(),
                "totalNet", records.stream().map(r -> safe(r.getNetSalary())).reduce(BigDecimal.ZERO, BigDecimal::add),
                "byDepartment", byDepartment,
                "byContractType", byContractType
        );
    }

    public Map<String, Object> ytd(String employeeCode, Integer year) {
        PayrollProfile profile = payrollProfileRepository.findByEmployeeCode(employeeCode)
                .orElseThrow(() -> new IllegalArgumentException("Payroll profile not found"));

        List<PayrollRecord> records = payrollRecordRepository.findAll().stream()
                .filter(r -> r.getUser() != null && profile.getUser().getId().equals(r.getUser().getId()))
                .filter(r -> year.equals(r.getYear()))
                .toList();

        BigDecimal gross = records.stream().map(r -> safe(r.getGrossSalary())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tax = records.stream().map(r -> safe(r.getTax())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal insurance = records.stream().map(r -> safe(r.getInsuranceDeduction())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal loan = records.stream().map(r -> safe(r.getLoanRepayment())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal net = records.stream().map(r -> safe(r.getNetSalary())).reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "employeeCode", employeeCode,
                "year", year,
                "grossYtd", gross,
                "taxYtd", tax,
                "insuranceYtd", insurance,
                "loanYtd", loan,
                "netYtd", net
        );
    }

    public List<Map<String, Object>> taxLiability(Integer year) {
        List<PayrollProfile> profiles = payrollProfileService.findAllActiveProfiles();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (PayrollProfile profile : profiles) {
            List<PayrollRecord> records = payrollRecordRepository.findAll().stream()
                    .filter(r -> r.getUser() != null && profile.getUser().getId().equals(r.getUser().getId()))
                    .filter(r -> year.equals(r.getYear()))
                    .toList();
            BigDecimal tax = records.stream().map(r -> safe(r.getTax())).reduce(BigDecimal.ZERO, BigDecimal::add);
            rows.add(Map.of(
                    "employeeCode", profile.getEmployeeCode(),
                    "employeeName", profile.getEmployeeName(),
                    "year", year,
                    "taxLiability", tax
            ));
        }
        return rows;
    }

    public List<Map<String, Object>> payrollCostTrend(int monthsBack) {
        if (monthsBack <= 0) monthsBack = 12;
        YearMonth current = YearMonth.now();
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = monthsBack - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            BigDecimal total = payrollRecordRepository.findByMonthAndYear(ym.getMonthValue(), ym.getYear()).stream()
                    .map(r -> safe(r.getNetSalary()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            trend.add(Map.of(
                    "month", ym.getMonthValue(),
                    "year", ym.getYear(),
                    "totalCost", total
            ));
        }
        return trend;
    }

    @Scheduled(cron = "0 0 7 * * ?")
    public void scheduledPayrollAndReminders() {
        LocalDate today = LocalDate.now();
        YearMonth ym = YearMonth.from(today);

        if (today.getDayOfMonth() == monthlyRunDay && !payrollProfileService.findActiveProfiles(PayCycle.MONTHLY).isEmpty()) {
            autoCreateRun(ym.getYear(), ym.getMonthValue(), PayCycle.MONTHLY);
        }

        DayOfWeek configuredWeeklyDay = DayOfWeek.valueOf(weeklyRunDay.toUpperCase(Locale.ROOT));
        if (today.getDayOfWeek() == configuredWeeklyDay && !payrollProfileService.findActiveProfiles(PayCycle.WEEKLY).isEmpty()) {
            autoCreateRun(ym.getYear(), ym.getMonthValue(), PayCycle.WEEKLY);
        }

        int week = today.get(WeekFields.ISO.weekOfWeekBasedYear());
        if (today.getDayOfWeek() == configuredWeeklyDay && week % 2 == 0 && !payrollProfileService.findActiveProfiles(PayCycle.BIWEEKLY).isEmpty()) {
            autoCreateRun(ym.getYear(), ym.getMonthValue(), PayCycle.BIWEEKLY);
        }

        sendProcessingReminders();
    }

    private void autoCreateRun(int year, int month, PayCycle payCycle) {
        try {
            PayrollRunRequest request = new PayrollRunRequest();
            request.setYear(year);
            request.setMonth(month);
            request.setPayCycle(payCycle);
            request.setNotes("Auto-scheduled payroll run");
            createDraftRun(request);
        } catch (Exception ignored) {
            // Skip if already created or invalid due to data constraints.
        }
    }

    private void sendProcessingReminders() {
        LocalDate today = LocalDate.now();
        List<PayrollRun> pendingRuns = payrollRunRepository.findAll().stream()
                .filter(r -> r.getStatus() == PayrollRunStatus.DRAFT || r.getStatus() == PayrollRunStatus.MANAGER_REVIEW)
                .filter(r -> r.getScheduledDate() != null)
                .toList();

        for (PayrollRun run : pendingRuns) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(today, run.getScheduledDate());
            if (days >= 0 && days <= reminderDaysBefore) {
                payrollAuditService.log(
                        "PayrollRun",
                        run.getId(),
                        "REMINDER",
                        null,
                        Map.of("message", "Payroll run reminder for upcoming scheduled date", "scheduledDate", run.getScheduledDate())
                );
            }
        }
    }

    private PayrollRecord generateRecordForProfile(PayrollProfile profile, int year, int month, PayrollRun run) {
        User user = profile.getUser();
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<AttendanceRecord> incomplete = attendanceRecordRepository
                .findByUserAndAttendanceDateBetweenAndCheckInTimeIsNotNullAndCheckOutTimeIsNull(user, start, end);
        if (!incomplete.isEmpty()) {
            throw new IllegalArgumentException("Salary cannot be processed because attendance data is incomplete for " + profile.getEmployeeCode());
        }

        List<AttendanceRecord> attendance = attendanceRecordRepository.findByUserAndAttendanceDateBetween(user, start, end);
        List<LeaveRecord> leaves = leaveRecordRepository.findByUserAndLeaveDateBetween(user, start, end);

        int workingDays = (int) attendance.stream().filter(a -> a.getCheckInTime() != null && a.getCheckOutTime() != null).count();
        int leaveDays = leaves.size();
        int lateDays = (int) attendance.stream().filter(AttendanceRecord::isLate).count();
        int expectedWorkingDays = (int) start.datesUntil(end.plusDays(1))
                .filter(d -> d.getDayOfWeek() != DayOfWeek.SATURDAY && d.getDayOfWeek() != DayOfWeek.SUNDAY)
                .count();
        int absentDays = Math.max(expectedWorkingDays - workingDays - leaveDays, 0);

        double totalWorkedHours = attendance.stream().mapToDouble(a -> Optional.ofNullable(a.getWorkingHours()).orElse(0.0)).sum();
        double overtimeHours = attendance.stream().mapToDouble(a -> Optional.ofNullable(a.getOvertimeHours()).orElse(0.0)).sum();

        validateWeeklyOvertime(attendance, profile.getEmployeeCode());

        long shiftCount = attendance.stream()
                .filter(a -> a.getShiftType() == ShiftType.NIGHT || a.getShiftType() == ShiftType.WEEKEND)
                .count();

        BigDecimal basePay = resolveBasePay(profile, workingDays, totalWorkedHours);
        BigDecimal overtimeMultiplier = nz(profile.getOvertimeMultiplier()).compareTo(BigDecimal.ZERO) > 0
                ? profile.getOvertimeMultiplier()
                : new BigDecimal("1.5");

        BigDecimal overtimeRateBase = resolveHourlyBase(profile, basePay, workingDays, totalWorkedHours);
        BigDecimal overtimePay = profile.getContractType() == ContractType.MANAGER
                ? BigDecimal.ZERO
                : overtimeRateBase.multiply(BigDecimal.valueOf(overtimeHours)).multiply(overtimeMultiplier).setScale(2, RoundingMode.HALF_UP);

        BigDecimal standardAllowances = nz(profile.getHousingAllowance())
                .add(nz(profile.getTransportAllowance()))
                .add(nz(profile.getMealAllowance()));
        BigDecimal shiftAllowance = profile.getContractType() == ContractType.STAFF_MEMBER
                ? nz(profile.getShiftAllowancePerShift()).multiply(BigDecimal.valueOf(shiftCount)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal performanceBonus = profile.getContractType() == ContractType.MANAGER
                ? nz(profile.getPerformanceBonus())
                : BigDecimal.ZERO;

        BigDecimal grossPay = basePay
                .add(overtimePay)
                .add(standardAllowances)
                .add(shiftAllowance)
                .add(performanceBonus)
                .add(nz(profile.getCarryForwardAmount()))
                .setScale(2, RoundingMode.HALF_UP);

        int extraLeaves = Math.max(leaveDays - maxPaidLeaves, 0);
        BigDecimal leaveDeduction = resolveDailyBase(profile, basePay, workingDays)
                .multiply(BigDecimal.valueOf(extraLeaves))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal taxRate = resolveTaxRate(profile);
        BigDecimal insuranceRate = nz(profile.getInsuranceRate()).compareTo(BigDecimal.ZERO) > 0 ? profile.getInsuranceRate() : defaultInsuranceRate;
        BigDecimal tax = grossPay.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal insurance = grossPay.multiply(insuranceRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal loan = nz(profile.getLoanRepayment());
        BigDecimal netPay = grossPay
                .subtract(tax)
                .subtract(insurance)
                .subtract(loan)
                .subtract(leaveDeduction)
                .setScale(2, RoundingMode.HALF_UP);
        if (netPay.compareTo(BigDecimal.ZERO) < 0) {
            netPay = BigDecimal.ZERO;
        }

        PayrollRecord record = payrollRecordRepository.findByUserAndMonthAndYear(user, month, year).stream()
                .findFirst()
                .orElseGet(PayrollRecord::new);
        if (record.getId() != null && record.isLocked()) {
            throw new IllegalArgumentException("Payroll is already approved/locked for employee " + profile.getEmployeeCode() + " in " + year + "-" + month);
        }
        PayrollRecord before = record.getId() == null ? null : copyRecord(record);

        record.setPayrollRun(run);
        record.setUser(user);
        record.setEmployeeName(profile.getEmployeeName());
        record.setEmployeeId(profile.getEmployeeCode());
        record.setDepartment(profile.getDepartment());
        record.setEmployeeCode(profile.getEmployeeCode());
        record.setMonth(month);
        record.setYear(year);
        record.setPayrollMonth(String.format("%04d-%02d", year, month));
        record.setWorkingDays(workingDays);
        record.setLeaveDays(leaveDays);
        record.setAbsentDays(absentDays);
        record.setLateDays(lateDays);
        record.setTotalOvertimeHours(round(overtimeHours));
        record.setBaseSalary(basePay);
        record.setOvertimeRate(overtimeMultiplier);
        record.setOvertimePay(overtimePay);
        record.setGrossSalary(grossPay);
        record.setShiftAllowance(shiftAllowance);
        record.setLeaveDeduction(leaveDeduction);
        record.setTax(tax);
        record.setInsuranceDeduction(insurance);
        record.setLoanRepayment(loan);
        record.setCarryForwardAmount(nz(profile.getCarryForwardAmount()));
        record.setDeductions(loan);
        record.setEpf(BigDecimal.ZERO);
        record.setNetSalary(netPay);
        record.setPaymentStatus(PayrollPaymentStatus.UNPAID);
        record.setLocked(false);
        record.setGeneratedDate(LocalDate.now());
        record.setPayDate(run.getScheduledDate());
        record.setNotes("Payroll draft generated from attendance and contract rules");

        record = payrollRecordRepository.save(record);
        payrollAuditService.log("PayrollRecord", record.getId(), before == null ? "CREATE" : "UPSERT", before, record);
        return record;
    }

    private void validateWeeklyOvertime(List<AttendanceRecord> attendance, String employeeCode) {
        Map<String, Double> weekly = new HashMap<>();
        for (AttendanceRecord a : attendance) {
            if (a.getAttendanceDate() == null) continue;
            int week = a.getAttendanceDate().get(WeekFields.ISO.weekOfWeekBasedYear());
            int year = a.getAttendanceDate().getYear();
            String key = year + "-" + week;
            weekly.put(key, weekly.getOrDefault(key, 0.0) + Optional.ofNullable(a.getOvertimeHours()).orElse(0.0));
        }
        for (Map.Entry<String, Double> e : weekly.entrySet()) {
            if (e.getValue() > legalMaxWeeklyOvertimeHours) {
                throw new IllegalArgumentException("Overtime exceeds legal weekly maximum for " + employeeCode + " on week " + e.getKey());
            }
        }
    }

    private BigDecimal resolveBasePay(PayrollProfile profile, int workingDays, double totalWorkedHours) {
        if (profile.getContractType() == ContractType.STAFF_MEMBER) {
            if (nz(profile.getHourlyRate()).compareTo(BigDecimal.ZERO) > 0) {
                return profile.getHourlyRate().multiply(BigDecimal.valueOf(totalWorkedHours)).setScale(2, RoundingMode.HALF_UP);
            }
            if (nz(profile.getDailyRate()).compareTo(BigDecimal.ZERO) > 0) {
                return profile.getDailyRate().multiply(BigDecimal.valueOf(workingDays)).setScale(2, RoundingMode.HALF_UP);
            }
        }
        return nz(profile.getBaseSalary()).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveHourlyBase(PayrollProfile profile, BigDecimal basePay, int workingDays, double workedHours) {
        if (profile.getContractType() == ContractType.STAFF_MEMBER && nz(profile.getHourlyRate()).compareTo(BigDecimal.ZERO) > 0) {
            return profile.getHourlyRate();
        }
        if (workedHours > 0) {
            return basePay.divide(BigDecimal.valueOf(workedHours), 6, RoundingMode.HALF_UP);
        }
        if (workingDays > 0) {
            return basePay.divide(BigDecimal.valueOf(workingDays * 8.0), 6, RoundingMode.HALF_UP);
        }
        return basePay.divide(BigDecimal.valueOf(30L * 8L), 6, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveDailyBase(PayrollProfile profile, BigDecimal basePay, int workingDays) {
        if (profile.getContractType() == ContractType.STAFF_MEMBER && nz(profile.getDailyRate()).compareTo(BigDecimal.ZERO) > 0) {
            return profile.getDailyRate();
        }
        if (workingDays <= 0) {
            return basePay.divide(BigDecimal.valueOf(30), 6, RoundingMode.HALF_UP);
        }
        return basePay.divide(BigDecimal.valueOf(workingDays), 6, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveTaxRate(PayrollProfile profile) {
        if (nz(profile.getTaxRate()).compareTo(BigDecimal.ZERO) > 0) {
            return profile.getTaxRate();
        }
        if (profile.getContractType() == ContractType.MANAGER) return defaultManagerTaxRate;
        if (profile.getContractType() == ContractType.ADMIN) return defaultAdminTaxRate;
        return defaultStaffTaxRate;
    }

    private String currentActor() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) return "SYSTEM";
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private PayrollRun copyRun(PayrollRun run) {
        return PayrollRun.builder()
                .id(run.getId())
                .status(run.getStatus())
                .locked(run.isLocked())
                .notes(run.getNotes())
                .recordCount(run.getRecordCount())
                .totalNetAmount(run.getTotalNetAmount())
                .createdBy(run.getCreatedBy())
                .managerReviewedBy(run.getManagerReviewedBy())
                .adminApprovedBy(run.getAdminApprovedBy())
                .financeReleasedBy(run.getFinanceReleasedBy())
                .build();
    }

    private PayrollRecord copyRecord(PayrollRecord row) {
        return PayrollRecord.builder()
                .id(row.getId())
                .employeeName(row.getEmployeeName())
                .employeeId(row.getEmployeeId())
                .department(row.getDepartment())
                .employeeCode(row.getEmployeeCode())
                .month(row.getMonth())
                .year(row.getYear())
                .payrollMonth(row.getPayrollMonth())
                .workingDays(row.getWorkingDays())
                .leaveDays(row.getLeaveDays())
                .absentDays(row.getAbsentDays())
                .lateDays(row.getLateDays())
                .totalOvertimeHours(row.getTotalOvertimeHours())
                .baseSalary(row.getBaseSalary())
                .overtimeRate(row.getOvertimeRate())
                .overtimePay(row.getOvertimePay())
                .grossSalary(row.getGrossSalary())
                .shiftAllowance(row.getShiftAllowance())
                .leaveDeduction(row.getLeaveDeduction())
                .deductions(row.getDeductions())
                .insuranceDeduction(row.getInsuranceDeduction())
                .loanRepayment(row.getLoanRepayment())
                .carryForwardAmount(row.getCarryForwardAmount())
                .tax(row.getTax())
                .netSalary(row.getNetSalary())
                .paymentStatus(row.getPaymentStatus())
                .locked(row.isLocked())
                .build();
    }

    private LocalDate dueDateForCycle(int year, int month, PayCycle payCycle) {
        YearMonth ym = YearMonth.of(year, month);
        if (payCycle == PayCycle.MONTHLY) {
            return ym.atDay(Math.min(monthlyRunDay, ym.lengthOfMonth()));
        }
        DayOfWeek configured = DayOfWeek.valueOf(weeklyRunDay.toUpperCase(Locale.ROOT));
        LocalDate cursor = ym.atDay(1);
        while (cursor.getDayOfWeek() != configured) {
            cursor = cursor.plusDays(1);
        }
        if (payCycle == PayCycle.BIWEEKLY) {
            cursor = cursor.plusWeeks(1);
        }
        return cursor;
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private double round(double n) {
        return Math.round(n * 100.0) / 100.0;
    }
}
