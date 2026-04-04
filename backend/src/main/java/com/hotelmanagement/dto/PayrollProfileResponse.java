package com.hotelmanagement.dto;

import com.hotelmanagement.entity.ContractType;
import com.hotelmanagement.entity.PayCycle;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class PayrollProfileResponse {
    private Long id;
    private Long userId;
    private String employeeCode;
    private String employeeName;
    private String email;
    private ContractType contractType;
    private String department;
    private PayCycle payCycle;
    private BigDecimal baseSalary;
    private BigDecimal hourlyRate;
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
    private boolean bankVerified;
    private boolean active;
    private boolean archived;
    private boolean finalSettlementCalculated;
    private LocalDate joinDate;
}
