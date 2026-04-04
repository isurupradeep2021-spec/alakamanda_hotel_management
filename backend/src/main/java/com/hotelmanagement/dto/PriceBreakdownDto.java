package com.hotelmanagement.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceBreakdownDto {
    
    private Long roomId;
    private String roomNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private long numberOfNights;
    
    private BigDecimal basePrice;
    private BigDecimal weekendPrice;
    private int weekendNights;
    private BigDecimal weekendCost;
    
    private int weekdayNights;
    private BigDecimal weekdayCost;
    
    private BigDecimal seasonalMultiplier;
    private BigDecimal seasonalAdjustment;
    
    private boolean isPopularRoom;
    private BigDecimal popularityPremium;
    
    private BigDecimal totalCost;
    private String breakdown; // Human-readable description
}
