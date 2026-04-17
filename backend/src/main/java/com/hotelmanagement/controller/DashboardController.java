package com.hotelmanagement.controller;

import com.hotelmanagement.entity.RoomBooking;
import com.hotelmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
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

    @GetMapping("/room-booking-insights")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'STAFF', 'RESTAURANT_MANAGER', 'EVENT_MANAGER')")
    public Map<String, List<Map<String, Object>>> roomBookingInsights() {
        Map<String, Long> countsByRoom = new HashMap<>();

        // Include all rooms so least-booked also shows rooms with 0 bookings.
        roomRepository.findAll().forEach(room -> countsByRoom.put(room.getRoomNumber(), 0L));

        List<RoomBooking> activeBookings = roomBookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == null || !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .toList();

        for (RoomBooking booking : activeBookings) {
            String roomNumber = booking.getRoomNumber();
            if (roomNumber == null || roomNumber.isBlank()) {
                continue;
            }
            countsByRoom.merge(roomNumber, 1L, Long::sum);
        }

        List<Map<String, Object>> topBookedRooms = countsByRoom.entrySet().stream()
                .sorted(
                        Comparator.<Map.Entry<String, Long>>comparingLong(Map.Entry::getValue).reversed()
                                .thenComparing(Map.Entry::getKey)
                )
                .limit(5)
                .map(e -> Map.<String, Object>of(
                        "roomNumber", e.getKey(),
                        "bookingCount", e.getValue()
                ))
                .toList();

        List<Map<String, Object>> leastBookedRooms = countsByRoom.entrySet().stream()
                .sorted(
                        Comparator.<Map.Entry<String, Long>>comparingLong(Map.Entry::getValue)
                                .thenComparing(Map.Entry::getKey)
                )
                .limit(5)
                .map(e -> Map.<String, Object>of(
                        "roomNumber", e.getKey(),
                        "bookingCount", e.getValue()
                ))
                .toList();

        return Map.of(
                "topBookedRooms", topBookedRooms,
                "leastBookedRooms", leastBookedRooms
        );
    }
}
