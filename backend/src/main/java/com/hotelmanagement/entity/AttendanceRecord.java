package com.hotelmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate attendanceDate;

    private LocalDateTime checkInTime;

    private LocalDateTime checkOutTime;

    @Builder.Default
    private Double workingHours = 0.0;

    @Builder.Default
    private Double overtimeHours = 0.0;

    private boolean late;

    @PrePersist
    public void onCreate() {
        if (attendanceDate == null) {
            attendanceDate = LocalDate.now();
        }
    }

    public void updateHours() {
        if (checkInTime == null || checkOutTime == null || checkOutTime.isBefore(checkInTime)) {
            return;
        }
        Duration d = Duration.between(checkInTime, checkOutTime);
        double hours = Math.round((d.toMinutes() / 60.0) * 100.0) / 100.0;
        this.workingHours = Math.max(hours, 0);
        this.overtimeHours = this.workingHours > 8 ? Math.round((this.workingHours - 8) * 100.0) / 100.0 : 0.0;
    }
}
