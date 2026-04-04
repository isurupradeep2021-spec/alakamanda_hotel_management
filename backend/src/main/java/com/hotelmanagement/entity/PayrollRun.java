package com.hotelmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer year;
    private Integer month;

    private LocalDate periodStart;
    private LocalDate periodEnd;

    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayCycle payCycle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PayrollRunStatus status = PayrollRunStatus.DRAFT;

    @Builder.Default
    private boolean locked = false;

    private String createdBy;
    private String managerReviewedBy;
    private String adminApprovedBy;
    private String financeReleasedBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime managerReviewedAt;
    private LocalDateTime adminApprovedAt;
    private LocalDateTime financeReleasedAt;

    private String notes;

    @Builder.Default
    private BigDecimal totalNetAmount = BigDecimal.ZERO;

    @Builder.Default
    private Integer recordCount = 0;
}
