package com.hotelmanagement.repository;

import com.hotelmanagement.entity.PayrollRecord;
import com.hotelmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayrollRecordRepository extends JpaRepository<PayrollRecord, Long> {
    List<PayrollRecord> findByPayrollMonth(String payrollMonth);

    List<PayrollRecord> findByEmployeeNameContainingIgnoreCase(String employeeName);

    List<PayrollRecord> findByMonthAndYear(Integer month, Integer year);

    List<PayrollRecord> findByUserAndMonthAndYear(User user, Integer month, Integer year);

    Optional<PayrollRecord> findFirstByUserOrderByGeneratedDateDesc(User user);
}
