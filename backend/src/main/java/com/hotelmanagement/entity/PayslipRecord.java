package com.hotelmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payslip_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayslipRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", nullable = false)
    private PayrollRecord payroll;

    @Column(nullable = false)
    private String employeeId;

    @Column(nullable = false)
    private String fileName;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] pdfData;

    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();
}
