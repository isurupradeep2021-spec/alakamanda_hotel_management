package com.hotelmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String employeeCode;

    @Column(nullable = false)
    private String employeeName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractType contractType;

    @Column(nullable = false)
    private String department;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayCycle payCycle;

    // Manager/Admin fixed monthly base, fallback for staff when daily/hourly not set.
    @Builder.Default
    private BigDecimal baseSalary = BigDecimal.ZERO;

    // Staff wage options.
    private BigDecimal hourlyRate;
    private BigDecimal dailyRate;

    // Allowances.
    @Builder.Default
    private BigDecimal housingAllowance = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal transportAllowance = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal mealAllowance = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal shiftAllowancePerShift = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal performanceBonus = BigDecimal.ZERO;

    // Deductions/rules.
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal insuranceRate = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal loanRepayment = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal overtimeMultiplier = new BigDecimal("1.5");
    @Builder.Default
    private BigDecimal carryForwardAmount = BigDecimal.ZERO;

    // Banking/tax.
    private String bankName;
    private String bankAccountNumber;
    private String paymentMethod;
    private String taxId;
    @Builder.Default
    private boolean bankVerified = false;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private boolean archived = false;

    private LocalDate archivedDate;

    @Builder.Default
    private boolean finalSettlementCalculated = false;

    @Builder.Default
    private LocalDate joinDate = LocalDate.now();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
