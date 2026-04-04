package com.hotelmanagement.dto;

import com.hotelmanagement.entity.ContractType;
import com.hotelmanagement.entity.PayCycle;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PayrollProfileRequest {

    @NotNull(message = "userId is required")
    private Long userId;

    @NotBlank(message = "employeeCode is required")
    private String employeeCode;

    @NotBlank(message = "employeeName is required")
    private String employeeName;

    @NotNull(message = "contractType is required")
    private ContractType contractType;

    @NotBlank(message = "department is required")
    private String department;

    @NotNull(message = "payCycle is required")
    private PayCycle payCycle;

    @DecimalMin(value = "0.0", message = "baseSalary cannot be negative")
    private BigDecimal baseSalary;

    @DecimalMin(value = "0.0", message = "hourlyRate cannot be negative")
    private BigDecimal hourlyRate;

    @DecimalMin(value = "0.0", message = "dailyRate cannot be negative")
    private BigDecimal dailyRate;

    private BigDecimal housingAllowance;
    private BigDecimal transportAllowance;
    private BigDecimal mealAllowance;
    private BigDecimal shiftAllowancePerShift;
    private BigDecimal performanceBonus;

    private BigDecimal taxRate;
    private BigDecimal insuranceRate;
    private BigDecimal loanRepayment;
    private BigDecimal overtimeMultiplier;
    private BigDecimal carryForwardAmount;

    private String bankName;
    private String bankAccountNumber;
    private String paymentMethod;
    private String taxId;
}
