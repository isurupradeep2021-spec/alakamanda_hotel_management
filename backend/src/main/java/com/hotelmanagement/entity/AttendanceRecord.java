package com.hotelmanagement.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

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

    private boolean earlyDeparture;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ShiftType shiftType = ShiftType.DAY;

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
        this.earlyDeparture = this.workingHours < 8.0;

        if (attendanceDate.getDayOfWeek() == java.time.DayOfWeek.SATURDAY
                || attendanceDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            this.shiftType = ShiftType.WEEKEND;
        } else if (checkInTime.toLocalTime().isAfter(LocalTime.of(18, 0))
                || checkOutTime.toLocalTime().isAfter(LocalTime.of(22, 0))) {
            this.shiftType = ShiftType.NIGHT;
        } else {
            this.shiftType = ShiftType.DAY;
        }
    }

    // Compatibility aliases for API consumers expecting date/clockIn/clockOut/totalHours keys.
    @JsonProperty("date")
    public LocalDate getDateAlias() {
        return attendanceDate;
    }

    @JsonProperty("totalHours")
    public Double getTotalHoursAlias() {
        return workingHours;
    }
}
