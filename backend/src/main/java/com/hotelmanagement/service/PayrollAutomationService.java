package com.hotelmanagement.service;

import com.hotelmanagement.entity.*;
import com.hotelmanagement.repository.*;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollAutomationService {

    private final UserRepository userRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final LeaveRecordRepository leaveRecordRepository;
    private final OvertimeRecordRepository overtimeRecordRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final PayslipRecordRepository payslipRecordRepository;
    private final RoomRepository roomRepository;
    private final RoomBookingRepository roomBookingRepository;
    private final EventBookingRepository eventBookingRepository;
    private final DiningBookingRepository diningBookingRepository;

    @Value("${app.payroll.overtime-multiplier:1.5}")
    private BigDecimal overtimeMultiplier;

    @Value("${app.payroll.max-paid-leaves:5}")
    private int maxPaidLeaves;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public AttendanceRecord checkIn(User user) {
        LocalDate today = LocalDate.now();
        AttendanceRecord attendance = attendanceRecordRepository.findByUserAndAttendanceDate(user, today)
                .orElseGet(() -> AttendanceRecord.builder().user(user).attendanceDate(today).build());

        if (attendance.getCheckInTime() == null) {
            LocalDateTime now = LocalDateTime.now();
            attendance.setCheckInTime(now);
            attendance.setLate(now.toLocalTime().isAfter(java.time.LocalTime.of(9, 15)));
        }
        return attendanceRecordRepository.save(attendance);
    }

    public AttendanceRecord checkOut(User user) {
        LocalDate today = LocalDate.now();
        AttendanceRecord attendance = attendanceRecordRepository.findByUserAndAttendanceDate(user, today)
                .orElseThrow(() -> new IllegalArgumentException("No check-in found for today"));

        if (attendance.getCheckInTime() == null) {
            throw new IllegalArgumentException("Please check in first");
        }

        attendance.setCheckOutTime(LocalDateTime.now());
        attendance.updateHours();
        attendance = attendanceRecordRepository.save(attendance);
        AttendanceRecord savedAttendance = attendance;

        if (savedAttendance.getOvertimeHours() != null && savedAttendance.getOvertimeHours() > 0) {
            BigDecimal hourlyRate = getHourlyRate(user);
            BigDecimal overtimePay = hourlyRate
                    .multiply(BigDecimal.valueOf(savedAttendance.getOvertimeHours()))
                    .multiply(overtimeMultiplier)
                    .setScale(2, RoundingMode.HALF_UP);

            OvertimeRecord overtimeRecord = overtimeRecordRepository.findByAttendanceRecord(savedAttendance)
                    .orElseGet(() -> OvertimeRecord.builder()
                            .user(user)
                            .attendanceRecord(savedAttendance)
                            .overtimeDate(today)
                            .build());

            overtimeRecord.setOvertimeHours(savedAttendance.getOvertimeHours());
            overtimeRecord.setOvertimePay(overtimePay);
            overtimeRecordRepository.save(overtimeRecord);
        }

        return savedAttendance;
    }

    public LeaveRecord requestLeave(User user, LocalDate leaveDate, String reason) {
        if (leaveDate == null) {
            throw new IllegalArgumentException("Leave date is required");
        }

        leaveRecordRepository.findByUserAndLeaveDate(user, leaveDate)
                .ifPresent(x -> {
                    throw new IllegalArgumentException("Leave already marked for this date");
                });

        LeaveRecord leave = LeaveRecord.builder()
                .user(user)
                .leaveDate(leaveDate)
                .reason(reason)
                .approved(true)
                .build();

        return leaveRecordRepository.save(leave);
    }

    public Map<String, Object> getMonthlyAttendanceSummary(User user, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<AttendanceRecord> attendance = attendanceRecordRepository.findByUserAndAttendanceDateBetween(user, start, end);
        List<LeaveRecord> leaves = leaveRecordRepository.findByUserAndLeaveDateBetween(user, start, end);
        List<OvertimeRecord> overtimes = overtimeRecordRepository.findByUserAndOvertimeDateBetween(user, start, end);

        int workingDays = (int) attendance.stream().filter(a -> a.getCheckOutTime() != null).count();
        int leaveDays = leaves.size();
        int lateDays = (int) attendance.stream().filter(AttendanceRecord::isLate).count();
        int absentDays = Math.max(ym.lengthOfMonth() - workingDays - leaveDays, 0);
        double overtimeHours = overtimes.stream().mapToDouble(x -> x.getOvertimeHours() == null ? 0.0 : x.getOvertimeHours()).sum();

        return Map.of(
                "month", month,
                "year", year,
                "workingDays", workingDays,
                "leaveDays", leaveDays,
                "lateDays", lateDays,
                "absentDays", absentDays,
                "totalOvertimeHours", round(overtimeHours),
                "maxPaidLeaves", maxPaidLeaves
        );
    }

    public List<AttendanceRecord> getAttendanceHistory(User user, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        return attendanceRecordRepository.findByUserAndAttendanceDateBetween(user, ym.atDay(1), ym.atEndOfMonth());
    }

    public List<LeaveRecord> getLeaveHistory(User user, int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        return leaveRecordRepository.findByUserAndLeaveDateBetween(user, ym.atDay(1), ym.atEndOfMonth());
    }

    public PayrollRecord generatePayrollForUser(User user, int year, int month) {
        Map<String, Object> summary = getMonthlyAttendanceSummary(user, year, month);

        int leaveDays = (int) summary.get("leaveDays");
        double overtimeHours = ((Number) summary.get("totalOvertimeHours")).doubleValue();
        BigDecimal baseSalary = resolveBaseSalary(user);
        BigDecimal hourlyRate = getHourlyRate(user);
        BigDecimal overtimePay = hourlyRate
                .multiply(BigDecimal.valueOf(overtimeHours))
                .multiply(overtimeMultiplier)
                .setScale(2, RoundingMode.HALF_UP);

        int extraLeaves = Math.max(leaveDays - maxPaidLeaves, 0);
        BigDecimal leaveDeduction = baseSalary
                .divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(extraLeaves))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal finalSalary = baseSalary
                .add(overtimePay)
                .subtract(leaveDeduction)
                .setScale(2, RoundingMode.HALF_UP);

        PayrollRecord payroll = payrollRecordRepository.findByUserAndMonthAndYear(user, month, year)
                .stream().findFirst()
                .orElseGet(PayrollRecord::new);

        payroll.setUser(user);
        payroll.setEmployeeName(user.getFullName());
        payroll.setEmployeeId(user.getEmployeeId());
        payroll.setDepartment(user.getEmploymentRole());
        payroll.setEmployeeCode(user.getEmployeeId());
        payroll.setMonth(month);
        payroll.setYear(year);
        payroll.setPayrollMonth(String.format("%04d-%02d", year, month));
        payroll.setWorkingDays((Integer) summary.get("workingDays"));
        payroll.setLeaveDays(leaveDays);
        payroll.setAbsentDays((Integer) summary.get("absentDays"));
        payroll.setLateDays((Integer) summary.get("lateDays"));
        payroll.setTotalOvertimeHours(overtimeHours);
        payroll.setBaseSalary(baseSalary);
        payroll.setOvertimeRate(overtimeMultiplier);
        payroll.setOvertimePay(overtimePay);
        payroll.setLeaveDeduction(leaveDeduction);
        payroll.setDeductions(BigDecimal.ZERO);
        payroll.setEpf(BigDecimal.ZERO);
        payroll.setTax(BigDecimal.ZERO);
        payroll.setNetSalary(finalSalary);
        payroll.setPaymentStatus(PayrollPaymentStatus.UNPAID);
        payroll.setGeneratedDate(LocalDate.now());
        payroll.setPayDate(LocalDate.now());
        payroll.setNotes("Auto-generated payroll");

        payroll = payrollRecordRepository.save(payroll);
        generatePayslip(payroll);
        return payroll;
    }

    public List<PayrollRecord> generatePayrollForMonth(int year, int month) {
        List<User> staffUsers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STAFF || u.getRole() == Role.MANAGER)
                .toList();

        List<PayrollRecord> records = new ArrayList<>();
        for (User user : staffUsers) {
            records.add(generatePayrollForUser(user, year, month));
        }
        return records;
    }

    public Map<String, Object> adminPayrollInsights(int year, int month) {
        List<PayrollRecord> records = payrollRecordRepository.findByMonthAndYear(month, year);

        BigDecimal totalExpense = records.stream()
                .map(r -> r.getNetSalary() == null ? BigDecimal.ZERO : r.getNetSalary())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        PayrollRecord highest = records.stream()
                .max(Comparator.comparing(r -> r.getTotalOvertimeHours() == null ? 0.0 : r.getTotalOvertimeHours()))
                .orElse(null);

        return Map.of(
                "month", month,
                "year", year,
                "totalSalaryExpense", totalExpense,
                "highestOvertimeEmployee", highest == null ? "N/A" : highest.getEmployeeName(),
                "highestOvertimeHours", highest == null ? 0.0 : round(highest.getTotalOvertimeHours() == null ? 0.0 : highest.getTotalOvertimeHours()),
                "recordCount", records.size()
        );
    }

    public PayrollRecord markPaymentStatus(Long payrollId, PayrollPaymentStatus status) {
        PayrollRecord payroll = payrollRecordRepository.findById(payrollId)
                .orElseThrow(() -> new IllegalArgumentException("Payroll record not found"));
        payroll.setPaymentStatus(status);
        return payrollRecordRepository.save(payroll);
    }

    public PayslipRecord getPayslipByPayroll(Long payrollId) {
        PayrollRecord payroll = payrollRecordRepository.findById(payrollId)
                .orElseThrow(() -> new IllegalArgumentException("Payroll not found"));

        return payslipRecordRepository.findByPayroll(payroll)
                .orElseGet(() -> generatePayslip(payroll));
    }

    public PayrollRecord getLatestPayrollForUser(User user) {
        return payrollRecordRepository.findFirstByUserOrderByGeneratedDateDesc(user)
                .orElse(null);
    }

    public String respondToChatbot(User user, String question) {
        String q = question == null ? "" : question.toLowerCase(Locale.ROOT);
        YearMonth ym = YearMonth.now();

        if (user.getRole() == Role.CUSTOMER) {
            return respondToCustomerChatbot(user, q);
        }

        if (user.getRole() != Role.ADMIN && user.getRole() != Role.MANAGER && user.getRole() != Role.STAFF) {
            return "I currently support payroll questions for Admin/Manager/Staff and booking questions for Customers.";
        }

        if (user.getRole() == Role.ADMIN || user.getRole() == Role.MANAGER) {
            if (q.contains("total salary") || q.contains("expense")) {
                Map<String, Object> insight = adminPayrollInsights(ym.getYear(), ym.getMonthValue());
                return "Total salary expense for " + ym + " is " + insight.get("totalSalaryExpense") + ".";
            }
            if (q.contains("highest overtime")) {
                Map<String, Object> insight = adminPayrollInsights(ym.getYear(), ym.getMonthValue());
                return insight.get("highestOvertimeEmployee") + " has the highest overtime with " + insight.get("highestOvertimeHours") + " hours.";
            }
            if (q.contains("generate payroll")) {
                Integer parsedMonth = parseMonthFromText(q);
                int targetMonth = parsedMonth == null ? ym.getMonthValue() : parsedMonth;
                List<PayrollRecord> generated = generatePayrollForMonth(ym.getYear(), targetMonth);
                return "Payroll generation completed for " + generated.size() + " staff for " + ym.getYear() + "-" + String.format("%02d", targetMonth) + ".";
            }
        }

        PayrollRecord latest = getLatestPayrollForUser(user);
        Map<String, Object> summary = getMonthlyAttendanceSummary(user, ym.getYear(), ym.getMonthValue());

        if (q.contains("salary")) {
            if (latest == null) {
                return "No payroll generated yet for this month.";
            }
            return "Your salary for " + latest.getPayrollMonth() + " is " + latest.getNetSalary()
                    + " (Base: " + latest.getBaseSalary() + ", Overtime: " + latest.getOvertimePay()
                    + ", Leave Deduction: " + latest.getLeaveDeduction() + ").";
        }
        if (q.contains("overtime")) {
            return "Your overtime hours this month: " + summary.get("totalOvertimeHours") + ".";
        }
        if (q.contains("leave")) {
            return "You used " + summary.get("leaveDays") + " leave days this month.";
        }
        if (q.contains("payslip")) {
            if (latest == null) {
                return "No payslip available yet. Payroll must be generated first.";
            }
            return "Payslip is available for payroll id " + latest.getId() + ".";
        }

        return "I can help with salary, overtime, leave summary, payslip, total expense, highest overtime, and payroll generation.";
    }

    @Scheduled(cron = "0 50 23 28-31 * ?")
    public void autoGenerateMonthlyPayroll() {
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        if (tomorrow.getMonth() != today.getMonth()) {
            YearMonth ym = YearMonth.from(today);
            generatePayrollForMonth(ym.getYear(), ym.getMonthValue());
        }
    }

    private PayslipRecord generatePayslip(PayrollRecord payroll) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document();
            PdfWriter.getInstance(doc, out);
            doc.open();
            doc.add(new Paragraph("Hotel Payroll Payslip"));
            doc.add(new Paragraph("Employee: " + payroll.getEmployeeName()));
            doc.add(new Paragraph("Employee ID: " + payroll.getEmployeeId()));
            doc.add(new Paragraph("Month: " + payroll.getPayrollMonth()));
            doc.add(new Paragraph("Base Salary: " + payroll.getBaseSalary()));
            doc.add(new Paragraph("Overtime Hours: " + payroll.getTotalOvertimeHours()));
            doc.add(new Paragraph("Overtime Pay: " + payroll.getOvertimePay()));
            doc.add(new Paragraph("Leave Deduction: " + payroll.getLeaveDeduction()));
            doc.add(new Paragraph("Final Salary: " + payroll.getNetSalary()));
            doc.add(new Paragraph("Payment Status: " + payroll.getPaymentStatus()));
            doc.close();

            PayslipRecord slip = payslipRecordRepository.findByPayroll(payroll).orElseGet(PayslipRecord::new);
            slip.setPayroll(payroll);
            slip.setEmployeeId(payroll.getEmployeeId());
            slip.setFileName("payslip-" + payroll.getEmployeeId() + "-" + payroll.getPayrollMonth() + ".pdf");
            slip.setPdfData(out.toByteArray());
            slip.setGeneratedAt(LocalDateTime.now());
            return payslipRecordRepository.save(slip);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate payslip PDF", e);
        }
    }

    private BigDecimal resolveBaseSalary(User user) {
        if (user.getBasicSalary() != null && user.getBasicSalary().compareTo(BigDecimal.ZERO) > 0) {
            return user.getBasicSalary();
        }

        String designation = Optional.ofNullable(user.getEmploymentRole()).orElse("").toLowerCase(Locale.ROOT);
        if (designation.contains("manager")) return new BigDecimal("4500.00");
        if (designation.contains("chef")) return new BigDecimal("2800.00");
        if (designation.contains("reception")) return new BigDecimal("2200.00");
        if (designation.contains("clean")) return new BigDecimal("1500.00");
        return new BigDecimal("2000.00");
    }

    private BigDecimal getHourlyRate(User user) {
        return resolveBaseSalary(user)
                .divide(BigDecimal.valueOf(30L * 8L), 6, RoundingMode.HALF_UP)
                .setScale(4, RoundingMode.HALF_UP);
    }

    private double round(double n) {
        return Math.round(n * 100.0) / 100.0;
    }

    private String respondToCustomerChatbot(User user, String q) {
        String email = Optional.ofNullable(user.getEmail()).orElse("");
        String nameKey = Optional.ofNullable(user.getFullName()).orElse("").trim();
        if (nameKey.isBlank() && email.contains("@")) {
            nameKey = email.substring(0, email.indexOf('@'));
        }

        List<Room> rooms = roomRepository.findAll();
        List<Room> availableRooms = rooms.stream()
                .filter(room -> room.isAvailable())
                .filter(room -> room.getStatus() == null || !"MAINTENANCE".equalsIgnoreCase(room.getStatus()))
                .toList();
        List<RoomBooking> myRoomBookings = roomBookingRepository.findByCustomerEmailIgnoreCaseOrderByCheckInDateDesc(email);
        List<EventBooking> myEvents = nameKey.isBlank()
                ? Collections.emptyList()
                : eventBookingRepository.findByCustomerNameContainingIgnoreCaseOrderByEventDateTimeDesc(nameKey);
        List<DiningBooking> myDining = diningBookingRepository.findByContactContainingIgnoreCaseOrderByBookingDateTimeDesc(email);

        if (containsAny(q, "room", "rooms", "stay", "book room")) {
            if (containsAny(q, "available", "availability")) {
                String roomTypes = availableRooms.stream()
                        .map(Room::getRoomType)
                        .filter(Objects::nonNull)
                        .distinct()
                        .limit(5)
                        .collect(Collectors.joining(", "));
                return "Available rooms right now: " + availableRooms.size()
                        + ". Room types: " + (roomTypes.isBlank() ? "Not listed yet" : roomTypes) + ".";
            }
            if (containsAny(q, "my", "booking", "booked")) {
                if (myRoomBookings.isEmpty()) {
                    return "You do not have room bookings yet. You can use Book Room to create one.";
                }
                RoomBooking latest = myRoomBookings.get(0);
                return "You have " + myRoomBookings.size() + " room booking(s). Latest: room "
                        + latest.getRoomNumber() + ", " + latest.getCheckInDate() + " to " + latest.getCheckOutDate()
                        + ", status: " + Optional.ofNullable(latest.getStatus()).orElse("PENDING") + ".";
            }
            Optional<BigDecimal> minPrice = rooms.stream()
                    .map(Room::getPricePerNight)
                    .filter(Objects::nonNull)
                    .min(Comparator.naturalOrder());
            return "You can ask about room availability, your room bookings, or room prices. "
                    + "Current starting price: " + minPrice.map(BigDecimal::toPlainString).orElse("N/A") + " per night.";
        }

        if (containsAny(q, "event", "events", "hall", "package")) {
            if (myEvents.isEmpty()) {
                return "You do not have event bookings yet. You can create one from Book Event.";
            }
            EventBooking latest = myEvents.get(0);
            return "You have " + myEvents.size() + " event booking(s). Latest: "
                    + Optional.ofNullable(latest.getEventType()).orElse("Event")
                    + " at " + Optional.ofNullable(latest.getHallName()).orElse("hall pending")
                    + " on " + latest.getEventDateTime()
                    + ", status: " + Optional.ofNullable(latest.getStatus()).orElse("INQUIRY") + ".";
        }

        if (containsAny(q, "restaurant", "dining", "menu", "food", "buffet")) {
            List<String> popularItems = diningBookingRepository.findTop30ByOrderByBookingDateTimeDesc().stream()
                    .map(DiningBooking::getMenuItem)
                    .filter(item -> item != null && !item.isBlank())
                    .collect(Collectors.groupingBy(item -> item, Collectors.counting()))
                    .entrySet()
                    .stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(3)
                    .map(Map.Entry::getKey)
                    .toList();

            if (containsAny(q, "my", "order", "booking")) {
                if (myDining.isEmpty()) {
                    return "You do not have restaurant bookings yet.";
                }
                DiningBooking latest = myDining.get(0);
                return "You have " + myDining.size() + " dining booking(s). Latest: "
                        + Optional.ofNullable(latest.getMenuItem()).orElse("menu item pending")
                        + " on " + latest.getBookingDateTime()
                        + ", status: " + Optional.ofNullable(latest.getStatus()).orElse("PENDING") + ".";
            }

            return "Popular menu items right now: "
                    + (popularItems.isEmpty() ? "No recent menu data yet" : String.join(", ", popularItems))
                    + ". Ask me: 'my dining bookings' to see your latest order status.";
        }

        return "I can help with rooms (availability, prices, your bookings), events (your booking status), and restaurant/menu (popular items, your dining bookings).";
    }

    private boolean containsAny(String source, String... words) {
        for (String word : words) {
            if (source.contains(word)) {
                return true;
            }
        }
        return false;
    }

    private Integer parseMonthFromText(String text) {
        Map<String, Integer> monthMap = Map.ofEntries(
                Map.entry("january", 1),
                Map.entry("february", 2),
                Map.entry("march", 3),
                Map.entry("april", 4),
                Map.entry("may", 5),
                Map.entry("june", 6),
                Map.entry("july", 7),
                Map.entry("august", 8),
                Map.entry("september", 9),
                Map.entry("october", 10),
                Map.entry("november", 11),
                Map.entry("december", 12)
        );
        for (Map.Entry<String, Integer> e : monthMap.entrySet()) {
            if (text.contains(e.getKey())) {
                return e.getValue();
            }
        }
        return null;
    }
}
