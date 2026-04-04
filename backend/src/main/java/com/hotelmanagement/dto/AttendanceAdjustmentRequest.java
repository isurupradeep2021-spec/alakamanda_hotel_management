package com.hotelmanagement.dto;

import com.hotelmanagement.entity.ShiftType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AttendanceAdjustmentRequest {
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private ShiftType shiftType;
    private Boolean late;
    private Boolean earlyDeparture;
}
