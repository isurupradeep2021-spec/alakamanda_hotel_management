package com.hotelmanagement.service;

import com.hotelmanagement.dto.PriceBreakdownDto;
import com.hotelmanagement.entity.Room;
import com.hotelmanagement.entity.RoomBooking;
import com.hotelmanagement.entity.Season;
import com.hotelmanagement.repository.RoomBookingRepository;
import com.hotelmanagement.repository.RoomRepository;
import com.hotelmanagement.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PricingService {

    private final RoomRepository roomRepository;
    private final RoomBookingRepository bookingRepository;
    private final SeasonRepository seasonRepository;

    // Constants
    private static final BigDecimal WEEKEND_MULTIPLIER = BigDecimal.valueOf(1.3); // 30% increase
    private static final BigDecimal POPULARITY_THRESHOLD = BigDecimal.valueOf(0.70); // 70% booked
    private static final BigDecimal POPULARITY_PREMIUM = BigDecimal.valueOf(1.15); // 15% increase

    /**
     * Calculate dynamic price with breakdown for given date range and room
     */
    public PriceBreakdownDto calculatePrice(Long roomId, LocalDate checkInDate, LocalDate checkOutDate) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        return calculatePrice(room, checkInDate, checkOutDate);
    }

    /**
     * Calculate dynamic price with breakdown for given room and dates
     */
    public PriceBreakdownDto calculatePrice(Room room, LocalDate checkInDate, LocalDate checkOutDate) {
        long numberOfNights = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        
        if (numberOfNights <= 0) {
            throw new IllegalArgumentException("Check-out date must be after check-in date");
        }

        PriceBreakdownDto breakdown = PriceBreakdownDto.builder()
                .roomId(room.getId())
                .roomNumber(room.getRoomNumber())
                .checkInDate(checkInDate)
                .checkOutDate(checkOutDate)
                .numberOfNights(numberOfNights)
                .basePrice(room.getPricePerNight())
                .weekendPrice(room.getWeekendPricePerNight())
                .build();

        // Count weekend and weekday nights
        int weekendCount = countWeekendNights(checkInDate, checkOutDate);
        int weekdayCount = (int) numberOfNights - weekendCount;

        breakdown.setWeekendNights(weekendCount);
        breakdown.setWeekdayNights(weekdayCount);

        BigDecimal baseNightPrice = room.getPricePerNight() != null ? room.getPricePerNight() : BigDecimal.ZERO;
        BigDecimal weekendNightPrice = room.getWeekendPricePerNight() != null 
                ? room.getWeekendPricePerNight() 
                : baseNightPrice.multiply(WEEKEND_MULTIPLIER);

        // Calculate weekday and weekend costs
        BigDecimal weekdayCost = baseNightPrice.multiply(BigDecimal.valueOf(weekdayCount));
        BigDecimal weekendCostValue = weekendNightPrice.multiply(BigDecimal.valueOf(weekendCount));

        breakdown.setWeekdayCost(weekdayCost);
        breakdown.setWeekendCost(weekendCostValue);

        BigDecimal subtotal = weekdayCost.add(weekendCostValue);

        // Check for seasonal pricing
        Optional<Season> season = findSeasonForRange(checkInDate, checkOutDate);
        if (season.isPresent()) {
            Season seasonObj = season.get();
            BigDecimal multiplier = seasonObj.getPriceMultiplier();
            BigDecimal seasonalAdjustment = subtotal.multiply(multiplier.subtract(BigDecimal.ONE));
            breakdown.setSeasonalMultiplier(multiplier);
            breakdown.setSeasonalAdjustment(seasonalAdjustment);
            subtotal = subtotal.multiply(multiplier);
        }

        // Check for popularity premium
        boolean isPopular = isRoomPopular(room.getRoomNumber());
        if (isPopular) {
            BigDecimal popularityAdjustment = subtotal.multiply(POPULARITY_PREMIUM.subtract(BigDecimal.ONE));
            breakdown.setPopularRoom(true);
            breakdown.setPopularityPremium(popularityAdjustment);
            subtotal = subtotal.multiply(POPULARITY_PREMIUM);
        }

        // Round to 2 decimal places
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        breakdown.setTotalCost(subtotal);

        // Generate human-readable breakdown
        breakdown.setBreakdown(generateBreakdownText(breakdown));

        return breakdown;
    }

    /**
     * Count weekend nights in a date range
     */
    private int countWeekendNights(LocalDate start, LocalDate end) {
        int weekendCount = 0;
        LocalDate current = start;
        
        while (current.isBefore(end)) {
            DayOfWeek day = current.getDayOfWeek();
            if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
                weekendCount++;
            }
            current = current.plusDays(1);
        }
        
        return weekendCount;
    }

    /**
     * Check if a date range overlaps with any active season
     */
    private Optional<Season> findSeasonForRange(LocalDate start, LocalDate end) {
        List<Season> activeSeason = seasonRepository.findAllActive();
        
        for (Season season : activeSeason) {
            // Check if any part of the booking overlaps with season
            if (start.isBefore(season.getEndDate()) && end.isAfter(season.getStartDate())) {
                return Optional.of(season);
            }
        }
        
        return Optional.empty();
    }

    /**
     * Determine if a room is "popular" based on booking frequency
     * A room is popular if >70% of available days are booked in the last 90 days
     */
    private boolean isRoomPopular(String roomNumber) {
        LocalDate ninetyDaysAgo = LocalDate.now().minusDays(90);
        LocalDate today = LocalDate.now();
        
        List<RoomBooking> recentBookings = bookingRepository.findByRoomNumber(roomNumber).stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> b.getCheckOutDate().isAfter(ninetyDaysAgo))
                .toList();

        if (recentBookings.isEmpty()) {
            return false;
        }

        // Calculate total booked nights in last 90 days
        long bookedNights = recentBookings.stream()
                .mapToLong(b -> {
                    LocalDate startDate = b.getCheckInDate().isBefore(ninetyDaysAgo) ? ninetyDaysAgo : b.getCheckInDate();
                    LocalDate endDate = b.getCheckOutDate().isAfter(today) ? today : b.getCheckOutDate();
                    return ChronoUnit.DAYS.between(startDate, endDate);
                })
                .sum();

        long totalDays = 90;
        BigDecimal occupancyRate = BigDecimal.valueOf(bookedNights).divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
        
        return occupancyRate.compareTo(POPULARITY_THRESHOLD) >= 0;
    }

    /**
     * Get popularity info for a room
     */
    public String getRoomPopularityStatus(String roomNumber) {
        if (isRoomPopular(roomNumber)) {
            return "POPULAR";
        }
        return "STANDARD";
    }

    /**
     * Generate human-readable breakdown text
     */
    private String generateBreakdownText(PriceBreakdownDto dto) {
        StringBuilder sb = new StringBuilder();
        
        sb.append(String.format("Weekdays (%d nights): $%.2f | ", 
            dto.getWeekdayNights(), dto.getWeekdayCost()));
        sb.append(String.format("Weekends (%d nights): $%.2f", 
            dto.getWeekendNights(), dto.getWeekendCost()));
        
        if (dto.getSeasonalMultiplier() != null) {
            sb.append(String.format(" | Seasonal (+%.0f%%): $%.2f", 
                dto.getSeasonalMultiplier().subtract(BigDecimal.ONE).multiply(BigDecimal.valueOf(100)),
                dto.getSeasonalAdjustment()));
        }
        
        if (dto.isPopularRoom()) {
            sb.append(String.format(" | Popular Room (+15%%): $%.2f", dto.getPopularityPremium()));
        }
        
        return sb.toString();
    }

    /**
     * Get booking frequency percentage for a room (last 90 days)
     */
    public BigDecimal getRoomOccupancyRate(String roomNumber) {
        LocalDate ninetyDaysAgo = LocalDate.now().minusDays(90);
        LocalDate today = LocalDate.now();
        
        List<RoomBooking> recentBookings = bookingRepository.findByRoomNumber(roomNumber).stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> b.getCheckOutDate().isAfter(ninetyDaysAgo))
                .toList();

        if (recentBookings.isEmpty()) {
            return BigDecimal.ZERO;
        }

        long bookedNights = recentBookings.stream()
                .mapToLong(b -> {
                    LocalDate startDate = b.getCheckInDate().isBefore(ninetyDaysAgo) ? ninetyDaysAgo : b.getCheckInDate();
                    LocalDate endDate = b.getCheckOutDate().isAfter(today) ? today : b.getCheckOutDate();
                    return ChronoUnit.DAYS.between(startDate, endDate);
                })
                .sum();

        long totalDays = 90;
        return BigDecimal.valueOf(bookedNights).divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
}
