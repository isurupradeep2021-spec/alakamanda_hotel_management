package com.hotelmanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RoomBookingRequest {

    @NotBlank(message = "customerName is required")
    private String customerName;

    @Email(message = "customerEmail must be valid")
    @NotBlank(message = "customerEmail is required")
    private String customerEmail;

    @NotBlank(message = "roomNumber is required")
    private String roomNumber;

    @NotNull(message = "checkInDate is required")
    private LocalDate checkInDate;

    @NotNull(message = "checkOutDate is required")
    private LocalDate checkOutDate;

    @NotNull(message = "guestCount is required")
    @Min(value = 1, message = "guestCount must be at least 1")
    private Integer guestCount;

    private String status;
}
