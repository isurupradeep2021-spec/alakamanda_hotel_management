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

    private String employeeName;

    private String employeeId;

    private String department;

    private String employeeCode;

    @Column(name = "payroll_month_number")
    private Integer month;

    @Column(name = "payroll_year")
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

    private BigDecimal leaveDeduction;

    private BigDecimal deductions;

    private BigDecimal epf;

    private BigDecimal tax;

    // Final salary for the month.
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PayrollPaymentStatus paymentStatus = PayrollPaymentStatus.UNPAID;

    private LocalDate payDate;

    private LocalDate generatedDate;

    private String payrollMonth;

    private String notes;
}
