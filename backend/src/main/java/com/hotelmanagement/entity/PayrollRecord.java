package com.hotelmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payroll_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_run_id")
    private PayrollRun payrollRun;

    private String employeeName;

    private String employeeId;

    private String department;

    private String employeeCode;

    private Integer month;

    private Integer year;

    private Integer workingDays;

    private Integer leaveDays;

    private Integer absentDays;

    private Integer lateDays;

    private Double totalOvertimeHours;

    private BigDecimal baseSalary;

    // Overtime multiplier (e.g., 1.5)
    private BigDecimal overtimeRate;

    private BigDecimal overtimePay;

    private BigDecimal grossSalary;

    private BigDecimal shiftAllowance;

    private BigDecimal leaveDeduction;

    private BigDecimal deductions;

    private BigDecimal insuranceDeduction;

    private BigDecimal loanRepayment;

    private BigDecimal carryForwardAmount;

    private BigDecimal epf;

    private BigDecimal tax;

    // Final salary for the month.
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PayrollPaymentStatus paymentStatus = PayrollPaymentStatus.UNPAID;

    @Builder.Default
    private boolean locked = false;

    private LocalDate payDate;

    private LocalDate generatedDate;

    private String payrollMonth;

    private String notes;
}
