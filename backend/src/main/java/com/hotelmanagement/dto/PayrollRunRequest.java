package com.hotelmanagement.dto;

import com.hotelmanagement.entity.PayCycle;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PayrollRunRequest {
    @NotNull(message = "year is required")
    private Integer year;

    @NotNull(message = "month is required")
    @Min(value = 1, message = "month must be between 1 and 12")
    @Max(value = 12, message = "month must be between 1 and 12")
    private Integer month;

    @NotNull(message = "payCycle is required")
    private PayCycle payCycle;

    private String notes;
}
