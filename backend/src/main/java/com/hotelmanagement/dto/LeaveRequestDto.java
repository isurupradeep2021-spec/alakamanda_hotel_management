package com.hotelmanagement.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class LeaveRequestDto {
    private LocalDate leaveDate;
    private String reason;
}
