package com.hotelmanagement.repository;

import com.hotelmanagement.entity.LeaveRecord;
import com.hotelmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LeaveRecordRepository extends JpaRepository<LeaveRecord, Long> {
    List<LeaveRecord> findByUserAndLeaveDateBetween(User user, LocalDate start, LocalDate end);

    Optional<LeaveRecord> findByUserAndLeaveDate(User user, LocalDate leaveDate);
}
