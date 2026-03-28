package com.hotelmanagement.controller;

import com.hotelmanagement.entity.EventBooking;
import com.hotelmanagement.repository.EventBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/event-bookings")
@RequiredArgsConstructor
public class EventBookingController {

    private static final Set<String> STATUS_FLOW = Set.of("INQUIRY", "QUOTATION", "APPROVAL", "CONFIRMATION", "COMPLETED", "CLOSED", "CANCELLED");
    private final EventBookingRepository repository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EVENT_MANAGER', 'CUSTOMER')")
    public List<EventBooking> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EVENT_MANAGER', 'CUSTOMER')")
    public EventBooking create(@RequestBody EventBooking booking) {
        validateStatus(booking.getStatus());
        ensureNoHallConflict(booking.getHallName(), booking.getEventDateTime(), null);
        booking.setTotalCost(calculateTotal(booking));
        return repository.save(booking);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public EventBooking update(@PathVariable Long id, @RequestBody EventBooking booking) {
        EventBooking existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event booking not found"));

        validateStatus(booking.getStatus());
        ensureNoHallConflict(booking.getHallName(), booking.getEventDateTime(), id);

        existing.setCustomerName(booking.getCustomerName());
        existing.setEventType(booking.getEventType());
        existing.setHallName(booking.getHallName());
        existing.setPackageName(booking.getPackageName());
        existing.setEventDateTime(booking.getEventDateTime());
        existing.setAttendees(booking.getAttendees());
        existing.setPricePerGuest(booking.getPricePerGuest());
        existing.setNotes(booking.getNotes());
        existing.setStatus(booking.getStatus());
        existing.setTotalCost(calculateTotal(existing));

        return repository.save(existing);
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
        BigDecimal total = rows.stream()
                .map(r -> r.getTotalCost() == null ? BigDecimal.ZERO : r.getTotalCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> byType = rows.stream()
                .collect(Collectors.groupingBy(r -> r.getEventType() == null ? "Unknown" : r.getEventType(), Collectors.counting()));

        return Map.of(
                "events", rows.size(),
                "eventRevenue", total,
                "popularTypes", byType
        );
    }

    private void ensureNoHallConflict(String hallName, java.time.LocalDateTime dateTime, Long currentId) {
        if (hallName == null || hallName.isBlank() || dateTime == null) {
            return;
        }
        List<EventBooking> existing = currentId == null
                ? repository.findByHallNameAndEventDateTimeBetween(hallName, dateTime.minusHours(4), dateTime.plusHours(4))
                : repository.findByHallNameAndIdNot(hallName, currentId);

        boolean conflict = existing.stream()
                .filter(r -> !"CANCELLED".equalsIgnoreCase(r.getStatus()))
                .anyMatch(r -> r.getEventDateTime() != null && Math.abs(java.time.Duration.between(r.getEventDateTime(), dateTime).toHours()) < 4);

        if (conflict) {
            throw new IllegalArgumentException("Hall conflict detected for selected date/time");
        }
    }

    private void validateStatus(String status) {
        if (status == null || !STATUS_FLOW.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid event status");
        }
    }

    private BigDecimal calculateTotal(EventBooking booking) {
        BigDecimal perGuest = booking.getPricePerGuest() == null ? BigDecimal.ZERO : booking.getPricePerGuest();
        int attendees = booking.getAttendees() == null ? 0 : booking.getAttendees();
        return perGuest.multiply(BigDecimal.valueOf(attendees));
    }
}
