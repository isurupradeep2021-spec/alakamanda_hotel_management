package com.hotelmanagement.controller;

import com.hotelmanagement.entity.Room;
import com.hotelmanagement.entity.RoomBooking;
import com.hotelmanagement.repository.RoomBookingRepository;
import com.hotelmanagement.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepository;
    private final RoomBookingRepository roomBookingRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Room createRoom(@RequestBody Room room) {
        if (room.getStatus() == null || room.getStatus().isBlank()) {
            room.setStatus(room.isAvailable() ? "AVAILABLE" : "OCCUPIED");
        }
        syncAvailabilityWithStatus(room);
        return roomRepository.save(room);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Room updateRoom(@PathVariable Long id, @RequestBody Room room) {
        Room existing = roomRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Room not found"));
        existing.setRoomNumber(room.getRoomNumber());
        existing.setRoomName(room.getRoomName());
        existing.setRoomType(room.getRoomType());
        existing.setDescription(room.getDescription());
        existing.setPhotoUrl(room.getPhotoUrl());
        existing.setCapacity(room.getCapacity());
        existing.setPricePerNight(room.getPricePerNight());
        existing.setWeekendPricePerNight(room.getWeekendPricePerNight());
        existing.setSpecialRate(room.getSpecialRate());
        existing.setStatus(room.getStatus());
        existing.setAvailable(room.isAvailable());
        syncAvailabilityWithStatus(existing);
        return roomRepository.save(existing);
    }

    @PostMapping("/{id}/complete-cleaning")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public Room completeCleaning(@PathVariable Long id) {
        Room room = roomRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Room not found"));

        if ("MAINTENANCE".equalsIgnoreCase(room.getStatus())) {
            throw new IllegalArgumentException("Room is under maintenance and cannot be marked available");
        }

        room.setStatus("AVAILABLE");
        room.setAvailable(true);
        return roomRepository.save(room);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
    }

    @GetMapping("/availability")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public Map<String, Object> availability(@RequestParam LocalDate checkIn, @RequestParam LocalDate checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Invalid check-in/check-out dates");
        }

        List<Room> rooms = roomRepository.findAll();
        long total = rooms.size();
        long available = rooms.stream()
            .filter(room -> isRoomAvailableForDateRange(room, checkIn, checkOut))
            .count();

        return Map.of(
                "checkIn", checkIn,
                "checkOut", checkOut,
                "totalRooms", total,
                "availableRooms", available
        );
    }

        private boolean isRoomAvailableForDateRange(Room room, LocalDate checkIn, LocalDate checkOut) {
        String status = room.getStatus() == null ? "" : room.getStatus();
        if ("MAINTENANCE".equalsIgnoreCase(status) || "CLEANING".equalsIgnoreCase(status)) {
            return false;
        }

        List<RoomBooking> bookings = roomBookingRepository.findByRoomNumber(room.getRoomNumber());
        boolean hasOverlap = bookings.stream()
            .filter(b -> b.getStatus() == null
                || (!"CANCELLED".equalsIgnoreCase(b.getStatus())
                && !"CHECKED_OUT".equalsIgnoreCase(b.getStatus())))
            .anyMatch(b -> checkIn.isBefore(b.getCheckOutDate()) && checkOut.isAfter(b.getCheckInDate()));

        return !hasOverlap;
        }

    private void syncAvailabilityWithStatus(Room room) {
        if (room.getStatus() == null || room.getStatus().isBlank()) {
            return;
        }

        if ("AVAILABLE".equalsIgnoreCase(room.getStatus())) {
            room.setAvailable(true);
            return;
        }

        room.setAvailable(false);
    }
}
