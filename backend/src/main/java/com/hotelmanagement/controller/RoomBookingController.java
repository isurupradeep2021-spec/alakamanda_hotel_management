package com.hotelmanagement.controller;

import com.hotelmanagement.dto.PriceBreakdownDto;
import com.hotelmanagement.entity.Room;
import com.hotelmanagement.entity.RoomBooking;
import com.hotelmanagement.repository.RoomBookingRepository;
import com.hotelmanagement.repository.RoomRepository;
import com.hotelmanagement.service.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/room-bookings")
@RequiredArgsConstructor
public class RoomBookingController {

    private final RoomBookingRepository repository;
    private final RoomRepository roomRepository;
    private final PricingService pricingService;

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
        RoomBooking saved = repository.save(booking);
        refreshRoomStatus(booking.getRoomNumber());
        return saved;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public RoomBooking update(@PathVariable Long id, @RequestBody RoomBooking booking) {
        RoomBooking existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room booking not found"));

        String previousRoomNumber = existing.getRoomNumber();

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
        RoomBooking saved = repository.save(existing);

        if ("CHECKED_OUT".equalsIgnoreCase(saved.getStatus())) {
            room.setStatus("CLEANING");
            room.setAvailable(false);
            roomRepository.save(room);
            if (previousRoomNumber != null && !previousRoomNumber.equalsIgnoreCase(saved.getRoomNumber())) {
                refreshRoomStatus(previousRoomNumber);
            }
            return saved;
        }

        refreshRoomStatus(saved.getRoomNumber());
        if (previousRoomNumber != null && !previousRoomNumber.equalsIgnoreCase(saved.getRoomNumber())) {
            refreshRoomStatus(previousRoomNumber);
        }
        return saved;
    }

    @PostMapping("/{id}/checkout")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public RoomBooking checkout(@PathVariable Long id) {
        RoomBooking booking = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room booking not found"));

        booking.setStatus("CHECKED_OUT");
        RoomBooking saved = repository.save(booking);

        Room room = roomRepository.findByRoomNumber(booking.getRoomNumber())
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        room.setStatus("CLEANING");
        room.setAvailable(false);
        roomRepository.save(room);

        return saved;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(@PathVariable Long id) {
        RoomBooking booking = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room booking not found"));
        String roomNumber = booking.getRoomNumber();
        repository.deleteById(id);
        refreshRoomStatus(roomNumber);
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

    @PostMapping("/calculate-price")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public PriceBreakdownDto calculatePrice(
            @RequestParam Long roomId,
            @RequestParam String checkInDate,
            @RequestParam String checkOutDate) {
        
        LocalDate checkIn = LocalDate.parse(checkInDate);
        LocalDate checkOut = LocalDate.parse(checkOutDate);
        
        return pricingService.calculatePrice(roomId, checkIn, checkOut);
    }

    @GetMapping("/{id}/price-breakdown")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public PriceBreakdownDto getPriceBreakdown(@PathVariable Long id) {
        RoomBooking booking = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room booking not found"));
        
        Room room = roomRepository.findByRoomNumber(booking.getRoomNumber())
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        
        return pricingService.calculatePrice(room, booking.getCheckInDate(), booking.getCheckOutDate());
    }

    @GetMapping("/room/{roomNumber}/popularity")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public Map<String, Object> getRoomPopularity(@PathVariable String roomNumber) {
        String status = pricingService.getRoomPopularityStatus(roomNumber);
        BigDecimal occupancyRate = pricingService.getRoomOccupancyRate(roomNumber);
        
        return Map.of(
                "roomNumber", roomNumber,
                "status", status,
                "occupancyRate", occupancyRate,
                "isPopular", "POPULAR".equals(status)
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
        try {
            PriceBreakdownDto breakdown = pricingService.calculatePrice(room, booking.getCheckInDate(), booking.getCheckOutDate());
            return breakdown.getTotalCost();
        } catch (Exception e) {
            // Fallback to simple calculation if pricing service fails
            long nights = ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate());
            if (nights <= 0) {
                return BigDecimal.ZERO;
            }
            BigDecimal nightly = room.getPricePerNight() == null ? BigDecimal.ZERO : room.getPricePerNight();
            return nightly.multiply(BigDecimal.valueOf(nights));
        }
    }

    private void refreshRoomStatus(String roomNumber) {
        if (roomNumber == null || roomNumber.isBlank()) {
            return;
        }

        Room room = roomRepository.findByRoomNumber(roomNumber).orElse(null);
        if (room == null) {
            return;
        }

        if ("MAINTENANCE".equalsIgnoreCase(room.getStatus()) || "CLEANING".equalsIgnoreCase(room.getStatus())) {
            room.setAvailable(false);
            roomRepository.save(room);
            return;
        }

        LocalDate today = LocalDate.now();
        List<RoomBooking> bookings = repository.findByRoomNumber(roomNumber).stream()
                .filter(b -> b.getStatus() == null
                        || (!"CANCELLED".equalsIgnoreCase(b.getStatus())
                        && !"CHECKED_OUT".equalsIgnoreCase(b.getStatus())))
                .sorted(Comparator.comparing(RoomBooking::getCheckInDate))
                .toList();

        boolean occupied = bookings.stream().anyMatch(b ->
                !today.isBefore(b.getCheckInDate()) && today.isBefore(b.getCheckOutDate()));

        if (occupied) {
            room.setStatus("OCCUPIED");
            room.setAvailable(false);
            roomRepository.save(room);
            return;
        }

        boolean reserved = bookings.stream().anyMatch(b -> !b.getCheckInDate().isBefore(today));
        if (reserved) {
            room.setStatus("RESERVED");
            room.setAvailable(false);
            roomRepository.save(room);
            return;
        }

        room.setStatus("AVAILABLE");
        room.setAvailable(true);
        roomRepository.save(room);
    }
}
