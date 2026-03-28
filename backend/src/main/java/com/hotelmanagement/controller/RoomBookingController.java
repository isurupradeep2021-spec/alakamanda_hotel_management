package com.hotelmanagement.controller;

import com.hotelmanagement.entity.Room;
import com.hotelmanagement.entity.RoomBooking;
import com.hotelmanagement.repository.RoomBookingRepository;
import com.hotelmanagement.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/room-bookings")
@RequiredArgsConstructor
public class RoomBookingController {

    private final RoomBookingRepository repository;
    private final RoomRepository roomRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public List<RoomBooking> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public RoomBooking create(@RequestBody RoomBooking booking) {
        validateDates(booking.getCheckInDate(), booking.getCheckOutDate());
        ensureNoOverlap(booking.getRoomNumber(), booking.getCheckInDate(), booking.getCheckOutDate(), null);

        Room room = roomRepository.findByRoomNumber(booking.getRoomNumber())
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        if (room.getCapacity() != null && booking.getGuestCount() != null && booking.getGuestCount() > room.getCapacity()) {
            throw new IllegalArgumentException("Guest count exceeds room capacity");
        }

        booking.setCreatedAt(LocalDateTime.now());
        booking.setStatus(booking.getStatus() == null ? "CONFIRMED" : booking.getStatus());
        booking.setTotalCost(calculateCost(booking, room));

        return repository.save(booking);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public RoomBooking update(@PathVariable Long id, @RequestBody RoomBooking booking) {
        RoomBooking existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room booking not found"));

        validateDates(booking.getCheckInDate(), booking.getCheckOutDate());
        ensureNoOverlap(booking.getRoomNumber(), booking.getCheckInDate(), booking.getCheckOutDate(), id);

        Room room = roomRepository.findByRoomNumber(booking.getRoomNumber())
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));

        if (room.getCapacity() != null && booking.getGuestCount() != null && booking.getGuestCount() > room.getCapacity()) {
            throw new IllegalArgumentException("Guest count exceeds room capacity");
        }

        existing.setCustomerName(booking.getCustomerName());
        existing.setCustomerEmail(booking.getCustomerEmail());
        existing.setRoomNumber(booking.getRoomNumber());
        existing.setCheckInDate(booking.getCheckInDate());
        existing.setCheckOutDate(booking.getCheckOutDate());
        existing.setGuestCount(booking.getGuestCount());
        existing.setStatus(booking.getStatus());
        existing.setTotalCost(calculateCost(existing, room));

        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public Map<String, Object> analytics() {
        List<RoomBooking> rows = repository.findAll();
        long active = rows.stream().filter(r -> !"CANCELLED".equalsIgnoreCase(r.getStatus())).count();
        BigDecimal revenue = rows.stream().map(r -> r.getTotalCost() == null ? BigDecimal.ZERO : r.getTotalCost()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
                "totalBookings", rows.size(),
                "activeBookings", active,
                "totalRevenue", revenue
        );
    }

    private void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Invalid check-in/check-out dates");
        }
    }

    private void ensureNoOverlap(String roomNumber, LocalDate checkIn, LocalDate checkOut, Long currentId) {
        List<RoomBooking> existing = currentId == null
                ? repository.findByRoomNumber(roomNumber)
                : repository.findByRoomNumberAndIdNot(roomNumber, currentId);

        boolean overlap = existing.stream()
                .filter(x -> !"CANCELLED".equalsIgnoreCase(x.getStatus()))
                .anyMatch(x -> checkIn.isBefore(x.getCheckOutDate()) && checkOut.isAfter(x.getCheckInDate()));

        if (overlap) {
            throw new IllegalArgumentException("This room is already booked for selected dates");
        }
    }

    private BigDecimal calculateCost(RoomBooking booking, Room room) {
        long nights = ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
        if (nights <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal nightly = room.getPricePerNight() == null ? BigDecimal.ZERO : room.getPricePerNight();
        return nightly.multiply(BigDecimal.valueOf(nights));
    }
}
