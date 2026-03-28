package com.hotelmanagement.controller;

import com.hotelmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final DiningBookingRepository diningBookingRepository;
    private final EventBookingRepository eventBookingRepository;
    private final RoomBookingRepository roomBookingRepository;
    private final PayrollRecordRepository payrollRecordRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF', 'RECEPTIONIST', 'RESTAURANT_MANAGER', 'EVENT_MANAGER', 'CUSTOMER')")
    public Map<String, Long> summary() {
        return Map.of(
                "users", userRepository.count(),
                "rooms", roomRepository.count(),
                "restaurantOrders", diningBookingRepository.count(),
                "eventBookings", eventBookingRepository.count(),
                "roomBookings", roomBookingRepository.count(),
                "payrollRecords", payrollRecordRepository.count()
        );
    }
}
