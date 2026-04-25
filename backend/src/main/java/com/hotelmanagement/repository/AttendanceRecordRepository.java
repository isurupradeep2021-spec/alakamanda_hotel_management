package com.hotelmanagement.repository;

import com.hotelmanagement.entity.AttendanceRecord;
import com.hotelmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    Optional<AttendanceRecord> findByUserAndAttendanceDate(User user, LocalDate date);

    List<AttendanceRecord> findByUserAndAttendanceDateBetween(User user, LocalDate start, LocalDate end);

    List<AttendanceRecord> findByUserAndAttendanceDateBetweenAndCheckInTimeIsNotNullAndCheckOutTimeIsNull(User user, LocalDate start, LocalDate end);

    List<AttendanceRecord> findByAttendanceDateBetween(LocalDate start, LocalDate end);
}
