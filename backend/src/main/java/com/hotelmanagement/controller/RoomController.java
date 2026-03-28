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
        return roomRepository.save(room);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Room updateRoom(@PathVariable Long id, @RequestBody Room room) {
        Room existing = roomRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Room not found"));
        existing.setRoomNumber(room.getRoomNumber());
        existing.setRoomType(room.getRoomType());
        existing.setDescription(room.getDescription());
        existing.setPhotoUrl(room.getPhotoUrl());
        existing.setCapacity(room.getCapacity());
        existing.setPricePerNight(room.getPricePerNight());
        existing.setWeekendPricePerNight(room.getWeekendPricePerNight());
        existing.setSpecialRate(room.getSpecialRate());
        existing.setAvailable(room.isAvailable());
        existing.setStatus(room.getStatus());
        return roomRepository.save(existing);
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
}
