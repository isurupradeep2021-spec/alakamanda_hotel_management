package com.hotelmanagement.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class RoomBookingResponse {
    private Long id;
    private String customerName;
    private String customerEmail;
    private String roomNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer guestCount;
    private BigDecimal totalCost;
    private LocalDateTime createdAt;
    private String status;
}
