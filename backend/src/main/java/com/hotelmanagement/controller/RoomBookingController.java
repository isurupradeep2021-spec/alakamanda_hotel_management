package com.hotelmanagement.controller;

import com.hotelmanagement.dto.RoomBookingRequest;
import com.hotelmanagement.dto.RoomBookingResponse;
import com.hotelmanagement.service.RoomBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/room-bookings")
@RequiredArgsConstructor
public class RoomBookingController {

    private final RoomBookingService roomBookingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public List<RoomBookingResponse> getAll() {
        return roomBookingService.getAllBookings();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public RoomBookingResponse create(@Valid @RequestBody RoomBookingRequest request) {
        return roomBookingService.createBooking(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public RoomBookingResponse update(@PathVariable Long id, @Valid @RequestBody RoomBookingRequest request) {
        return roomBookingService.updateBooking(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(@PathVariable Long id) {
        roomBookingService.deleteBooking(id);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
    public Map<String, Object> analytics() {
        return roomBookingService.getBookingAnalytics();
    }
}
