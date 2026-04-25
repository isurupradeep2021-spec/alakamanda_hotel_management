package com.hotelmanagement.controller;

import com.hotelmanagement.entity.EventBooking;
import com.hotelmanagement.repository.EventBookingRepository;
import com.hotelmanagement.service.EventBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/event-bookings")
@RequiredArgsConstructor
public class EventBookingController {

    private final EventBookingRepository repository;
    private final EventBookingService eventBookingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EVENT_MANAGER', 'CUSTOMER')")
    public List<EventBooking> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EVENT_MANAGER', 'CUSTOMER')")
    public EventBooking create(@RequestBody EventBooking booking) {
        return repository.save(eventBookingService.prepareForSave(booking, null));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public EventBooking update(@PathVariable Long id, @RequestBody EventBooking booking) {
        EventBooking existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event booking not found"));

        existing.setCustomerName(booking.getCustomerName());
        existing.setCustomerEmail(booking.getCustomerEmail());
        existing.setCustomerMobile(booking.getCustomerMobile());
        existing.setEventType(booking.getEventType());
        existing.setHallName(booking.getHallName());
        existing.setPackageName(booking.getPackageName());
        existing.setEventDateTime(booking.getEventDateTime());
        existing.setEndDateTime(booking.getEndDateTime());
        existing.setAttendees(booking.getAttendees());
        existing.setPricePerGuest(booking.getPricePerGuest());
        existing.setNotes(booking.getNotes());
        existing.setStatus(booking.getStatus());

        return repository.save(eventBookingService.prepareForSave(existing, id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public Map<String, Object> analytics() {
        List<EventBooking> rows = repository.findAll();

        Map<String, Long> byType = rows.stream()
                .collect(Collectors.groupingBy(r -> r.getEventType() == null ? "Unknown" : r.getEventType(), Collectors.counting()));

        return Map.of(
                "events", rows.size(),
                "eventRevenue", eventBookingService.sumRevenue(rows),
                "popularTypes", byType
        );
    }
}
