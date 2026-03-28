package com.hotelmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String roomNumber;

    @Column(nullable = false)
    private String roomType;

    @Column(length = 2000)
    private String description;

    @Column(length = 1200)
    private String photoUrl;

    private Integer capacity;

    @Column(nullable = false)
    private BigDecimal pricePerNight;

    private BigDecimal weekendPricePerNight;

    private BigDecimal specialRate;

    @Column(nullable = false)
    private boolean available;

    private String status;
}
