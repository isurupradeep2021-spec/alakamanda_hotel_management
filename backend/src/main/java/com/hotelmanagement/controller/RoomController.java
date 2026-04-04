package com.hotelmanagement.controller;

import com.hotelmanagement.entity.Room;
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
        long total = roomRepository.count();
        long available = roomRepository.findAll().stream()
                .filter(Room::isAvailable)
                .count();
        return Map.of(
                "checkIn", checkIn,
                "checkOut", checkOut,
                "totalRooms", total,
                "availableRooms", available
        );
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
