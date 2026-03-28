package com.hotelmanagement.repository;

import com.hotelmanagement.entity.OvertimeRecord;
import com.hotelmanagement.entity.User;
import com.hotelmanagement.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OvertimeRecordRepository extends JpaRepository<OvertimeRecord, Long> {
    List<OvertimeRecord> findByUserAndOvertimeDateBetween(User user, LocalDate start, LocalDate end);

    Optional<OvertimeRecord> findByAttendanceRecord(AttendanceRecord attendanceRecord);
}
