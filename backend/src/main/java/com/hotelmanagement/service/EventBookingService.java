package com.hotelmanagement.service;

import com.hotelmanagement.entity.EventBooking;
import com.hotelmanagement.repository.EventBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EventBookingService {

    private static final Set<String> VALID_STATUSES = Set.of(
            "INQUIRY", "CONFIRMED", "COMPLETED", "CANCELLED"
    );
    private static final Set<String> VALID_PACKAGES = Set.of("STANDARD", "PREMIUM");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^\\d{10}$");
    private static final BigDecimal PREMIUM_PACKAGE_FEE = new BigDecimal("10000.00");

    private final EventBookingRepository repository;

    public EventBooking prepareForSave(EventBooking booking, Long currentId) {
        if (booking == null) {
            throw new IllegalArgumentException("Event booking payload is required");
        }

        booking.setCustomerName(requireText(booking.getCustomerName(), "Customer name is required"));
        booking.setCustomerEmail(normalizeEmail(booking.getCustomerEmail()));
        booking.setCustomerMobile(validateMobile(booking.getCustomerMobile()));
        booking.setEventType(requireText(booking.getEventType(), "Event type is required"));
        booking.setHallName(requireText(booking.getHallName(), "Hall name is required"));
        booking.setPackageName(validatePackage(booking.getPackageName()));
        booking.setStatus(validateStatus(booking.getStatus()));
        booking.setEventDateTime(truncateToMinute(requireDateTime(booking.getEventDateTime(), "Starting date & time is required")));
        booking.setEndDateTime(truncateToMinute(requireDateTime(booking.getEndDateTime(), "End date & time is required")));
        validateDateRange(booking.getEventDateTime(), booking.getEndDateTime());

        if (booking.getAttendees() == null || booking.getAttendees() <= 0) {
            throw new IllegalArgumentException("Attendees must be greater than 0");
        }
        if (booking.getPricePerGuest() == null || booking.getPricePerGuest().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price per hour must be 0 or greater");
        }

        ensureNoHallConflict(booking.getHallName(), booking.getEventDateTime(), booking.getEndDateTime(), currentId);

        double durationHours = calculateDurationHours(booking.getEventDateTime(), booking.getEndDateTime());
        BigDecimal totalPrice = calculateTotalPrice(booking.getPricePerGuest(), durationHours, booking.getPackageName());

        booking.setDurationHours(durationHours);
        booking.setTotalPrice(totalPrice);
        booking.setTotalCost(totalPrice);
        return booking;
    }

    public BigDecimal sumRevenue(List<EventBooking> rows) {
        return rows.stream()
                .map(row -> row.getTotalPrice() != null ? row.getTotalPrice() : (row.getTotalCost() == null ? BigDecimal.ZERO : row.getTotalCost()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String normalizeEmail(String email) {
        String normalized = requireText(email, "Customer email is required").toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Customer email must be a valid email address");
        }
        return normalized;
    }

    private String validateMobile(String mobile) {
        String normalized = requireText(mobile, "Customer mobile number is required");
        if (!MOBILE_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Customer mobile number must be exactly 10 digits");
        }
        return normalized;
    }

    private String validatePackage(String packageName) {
        String normalized = requireText(packageName, "Package name is required").toUpperCase(Locale.ROOT);
        if (!VALID_PACKAGES.contains(normalized)) {
            throw new IllegalArgumentException("Package name must be Standard or Premium");
        }
        return normalized.substring(0, 1) + normalized.substring(1).toLowerCase(Locale.ROOT);
    }

    private String validateStatus(String status) {
        String normalized = requireText(status, "Booking status is required").toUpperCase(Locale.ROOT);
        if (!VALID_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid event status");
        }
        return normalized;
    }

    private LocalDateTime requireDateTime(LocalDateTime value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }

    private void validateDateRange(LocalDateTime start, LocalDateTime end) {
        if (!end.isAfter(start)) {
            throw new IllegalArgumentException("End date & time must be after starting date & time");
        }
    }

    private void ensureNoHallConflict(String hallName, LocalDateTime start, LocalDateTime end, Long currentId) {
        List<EventBooking> existing = currentId == null
                ? repository.findByHallNameIgnoreCase(hallName)
                : repository.findByHallNameIgnoreCaseAndIdNot(hallName, currentId);

        boolean conflict = existing.stream()
                .filter(row -> !"CANCELLED".equalsIgnoreCase(row.getStatus()))
                .anyMatch(row -> {
                    LocalDateTime existingStart = row.getEventDateTime();
                    LocalDateTime existingEnd = row.getEndDateTime() != null ? row.getEndDateTime() : row.getEventDateTime();
                    if (existingStart == null || existingEnd == null) {
                        return false;
                    }
                    return start.isBefore(existingEnd) && end.isAfter(existingStart);
                });

        if (conflict) {
            throw new IllegalArgumentException("Hall conflict detected for the selected time range");
        }
    }

    private double calculateDurationHours(LocalDateTime start, LocalDateTime end) {
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes <= 0) {
            throw new IllegalArgumentException("Duration must be greater than 0 minutes");
        }
        return BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private BigDecimal calculateTotalPrice(BigDecimal pricePerHour, double durationHours, String packageName) {
        BigDecimal total = pricePerHour.multiply(BigDecimal.valueOf(durationHours));
        if ("PREMIUM".equalsIgnoreCase(packageName)) {
            total = total.add(PREMIUM_PACKAGE_FEE);
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private LocalDateTime truncateToMinute(LocalDateTime value) {
        return value == null ? null : value.truncatedTo(ChronoUnit.MINUTES);
    }
}
