package com.hotelmanagement.controller;

import com.hotelmanagement.entity.DiningBooking;
import com.hotelmanagement.repository.DiningBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dining-bookings")
@RequiredArgsConstructor
public class DiningBookingController {

    private static final Set<String> VALID_STATUS = Set.of("PENDING", "PREPARING", "READY", "SERVED", "CANCELLED");
    private final DiningBookingRepository repository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RESTAURANT_MANAGER', 'RECEPTIONIST', 'CUSTOMER')")
    public List<DiningBooking> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RESTAURANT_MANAGER', 'CUSTOMER')")
    public DiningBooking create(@RequestBody DiningBooking booking) {
        if (booking.getStatus() == null || booking.getStatus().isBlank()) {
            booking.setStatus("PENDING");
        }
        validateStatus(booking.getStatus());
        booking.setTotalAmount(calculateTotal(booking));
        return repository.save(booking);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RESTAURANT_MANAGER')")
    public DiningBooking update(@PathVariable Long id, @RequestBody DiningBooking booking) {
        DiningBooking existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dining booking not found"));

        validateStatus(booking.getStatus());

        existing.setCustomerName(booking.getCustomerName());
        existing.setContact(booking.getContact());
        existing.setGuests(booking.getGuests());
        existing.setBookingDateTime(booking.getBookingDateTime());
        existing.setCategory(booking.getCategory());
        existing.setMenuItem(booking.getMenuItem());
        existing.setQuantity(booking.getQuantity());
        existing.setUnitPrice(booking.getUnitPrice());
        existing.setTableNumber(booking.getTableNumber());
        existing.setSpecialRequest(booking.getSpecialRequest());
        existing.setStatus(booking.getStatus());
        existing.setTotalAmount(calculateTotal(existing));

        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RESTAURANT_MANAGER')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RESTAURANT_MANAGER')")
    public Map<String, Object> analytics() {
        List<DiningBooking> rows = repository.findAll();
        BigDecimal revenue = rows.stream()
                .map(r -> r.getTotalAmount() == null ? BigDecimal.ZERO : r.getTotalAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> statusCount = rows.stream()
                .collect(Collectors.groupingBy(r -> r.getStatus() == null ? "UNKNOWN" : r.getStatus(), Collectors.counting()));

        return Map.of(
                "orders", rows.size(),
                "revenue", revenue,
                "statusCount", statusCount
        );
    }

    private void validateStatus(String status) {
        if (status == null || !VALID_STATUS.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid order status");
        }
    }

    private BigDecimal calculateTotal(DiningBooking row) {
        BigDecimal price = row.getUnitPrice() == null ? BigDecimal.ZERO : row.getUnitPrice();
        int quantity = row.getQuantity() == null ? 0 : row.getQuantity();
        return price.multiply(BigDecimal.valueOf(quantity));
    }
}
