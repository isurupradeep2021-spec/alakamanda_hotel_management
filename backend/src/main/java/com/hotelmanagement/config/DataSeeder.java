package com.hotelmanagement.config;

import com.hotelmanagement.entity.*;
import com.hotelmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final DiningBookingRepository diningBookingRepository;
    private final EventBookingRepository eventBookingRepository;
    private final RoomBookingRepository roomBookingRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        ensureSchemaCompatibility();
        seedUsers();
        seedRooms();
        seedBookings();
        seedPayroll();
    }

    private void ensureSchemaCompatibility() {
        jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL");
    }

    private void seedUsers() {
        upsertUser("Admin User", "admin@hotel.com", Role.ADMIN, "ADM-001", "Administrator", new BigDecimal("6000.00"), "0770000001");
        upsertUser("Manager User", "manager@hotel.com", Role.MANAGER, "MNG-001", "Manager", new BigDecimal("4500.00"), "0770000002");
        upsertUser("Staff Member", "staff@hotel.com", Role.STAFF, "STF-001", "Receptionist", new BigDecimal("2200.00"), "0770000007");

        // Keep existing project roles for other modules.
        upsertUser("Reception User", "reception@hotel.com", Role.RECEPTIONIST, "REC-001", "Receptionist", new BigDecimal("2200.00"), "0770000003");
        upsertUser("Restaurant User", "restaurant@hotel.com", Role.RESTAURANT_MANAGER, "RST-001", "Chef", new BigDecimal("2800.00"), "0770000004");
        upsertUser("Event User", "event@hotel.com", Role.EVENT_MANAGER, "EVT-001", "Event Coordinator", new BigDecimal("3000.00"), "0770000005");
        upsertUser("Customer User", "customer@hotel.com", Role.CUSTOMER, "CUS-001", "Guest", new BigDecimal("0.00"), "0770000006");
    }

    private void upsertUser(String fullName,
                            String email,
                            Role role,
                            String employeeId,
                            String employmentRole,
                            BigDecimal basicSalary,
                            String phone) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setRole(role);
        user.setEmployeeId(employeeId);
        user.setEmploymentRole(employmentRole);
        user.setBasicSalary(basicSalary);
        user.setJoinDate(user.getJoinDate() == null ? LocalDate.now().minusMonths(8) : user.getJoinDate());
        user.setEmploymentStatus(EmploymentStatus.ACTIVE);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode("Password@123"));
        userRepository.save(user);
    }

    private void seedRooms() {
        upsertRoom(
                "101",
                "Deluxe",
                "Elegant deluxe room with king bed, city view, work desk, and premium bath amenities for a calm luxury stay.",
                "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=80",
                2,
                new BigDecimal("120.00"),
                new BigDecimal("140.00"),
                new BigDecimal("110.00"),
                true,
                "AVAILABLE"
        );

        upsertRoom(
                "102",
                "Suite",
                "Spacious suite with separate lounge, panoramic window view, and curated in-room service experience.",
                "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=80",
                4,
                new BigDecimal("220.00"),
                new BigDecimal("260.00"),
                new BigDecimal("210.00"),
                true,
                "AVAILABLE"
        );

        upsertRoom(
                "103",
                "Standard",
                "Comfortable standard room designed for practical stays with modern essentials and warm interior finishes.",
                "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1400&q=80",
                2,
                new BigDecimal("80.00"),
                new BigDecimal("95.00"),
                new BigDecimal("75.00"),
                false,
                "MAINTENANCE"
        );
    }

    private void upsertRoom(String roomNumber,
                            String roomType,
                            String description,
                            String photoUrl,
                            Integer capacity,
                            BigDecimal pricePerNight,
                            BigDecimal weekendPricePerNight,
                            BigDecimal specialRate,
                            boolean available,
                            String status) {
        Room room = roomRepository.findByRoomNumber(roomNumber).orElseGet(Room::new);
        room.setRoomNumber(roomNumber);
        room.setRoomType(roomType);
        room.setDescription(description);
        room.setPhotoUrl(photoUrl);
        room.setCapacity(capacity);
        room.setPricePerNight(pricePerNight);
        room.setWeekendPricePerNight(weekendPricePerNight);
        room.setSpecialRate(specialRate);
        room.setAvailable(available);
        room.setStatus(status);
        roomRepository.save(room);
    }

    private void seedBookings() {
        if (diningBookingRepository.count() == 0) {
            diningBookingRepository.save(DiningBooking.builder()
                    .customerName("Customer User")
                    .contact("customer@hotel.com")
                    .guests(4)
                    .bookingDateTime(LocalDateTime.now().plusDays(1))
                    .category("Dinner")
                    .menuItem("Seafood Platter")
                    .quantity(2)
                    .unitPrice(new BigDecimal("45.00"))
                    .totalAmount(new BigDecimal("90.00"))
                    .tableNumber(6)
                    .specialRequest("Window side")
                    .status("PENDING")
                    .build());
        }

        if (eventBookingRepository.count() == 0) {
            eventBookingRepository.save(EventBooking.builder()
                    .customerName("Customer User")
                    .customerEmail("customer@hotel.com")
                    .customerMobile("0770000006")
                    .eventType("Wedding")
                    .hallName("Grand Ballroom")
                    .packageName("Premium")
                    .eventDateTime(LocalDateTime.now().plusDays(7))
                    .endDateTime(LocalDateTime.now().plusDays(7).plusHours(5))
                    .durationHours(5.0)
                    .attendees(120)
                    .pricePerGuest(new BigDecimal("25000.00"))
                    .totalPrice(new BigDecimal("135000.00"))
                    .totalCost(new BigDecimal("135000.00"))
                    .notes("Need custom flower setup")
                    .status("INQUIRY")
                    .build());
        }

        if (roomBookingRepository.count() == 0) {
            roomBookingRepository.save(RoomBooking.builder()
                    .customerName("Customer User")
                    .customerEmail("customer@hotel.com")
                    .roomNumber("101")
                    .checkInDate(LocalDate.now().plusDays(2))
                    .checkOutDate(LocalDate.now().plusDays(5))
                    .guestCount(2)
                    .totalCost(new BigDecimal("360.00"))
                    .createdAt(LocalDateTime.now())
                    .status("CONFIRMED")
                    .build());
        }
    }

    private void seedPayroll() {
        if (payrollRecordRepository.count() > 0) {
            return;
        }

        User staff = userRepository.findByEmail("staff@hotel.com").orElse(null);
        if (staff == null) {
            return;
        }

        payrollRecordRepository.save(PayrollRecord.builder()
                .user(staff)
                .employeeName(staff.getFullName())
                .employeeId(staff.getEmployeeId())
                .department(staff.getEmploymentRole())
                .employeeCode(staff.getEmployeeId())
                .month(YearMonth.now().getMonthValue())
                .year(YearMonth.now().getYear())
                .workingDays(24)
                .leaveDays(2)
                .absentDays(4)
                .lateDays(1)
                .totalOvertimeHours(8.5)
                .baseSalary(staff.getBasicSalary())
                .overtimeRate(new BigDecimal("1.50"))
                .overtimePay(new BigDecimal("116.88"))
                .leaveDeduction(BigDecimal.ZERO)
                .deductions(BigDecimal.ZERO)
                .epf(BigDecimal.ZERO)
                .tax(BigDecimal.ZERO)
                .netSalary(new BigDecimal("2316.88"))
                .paymentStatus(PayrollPaymentStatus.UNPAID)
                .generatedDate(LocalDate.now())
                .payDate(LocalDate.now())
                .payrollMonth(YearMonth.now().toString())
                .notes("Seed payroll")
                .build());
    }
}
