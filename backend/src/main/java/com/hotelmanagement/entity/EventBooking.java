package com.hotelmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;

    private String eventType;

    private String hallName;

    private String packageName;

    private LocalDateTime eventDateTime;

    private Integer attendees;

    private BigDecimal pricePerGuest;

    private BigDecimal totalCost;

    private String notes;

    private String status;
}
