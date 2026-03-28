package com.hotelmanagement.repository;

import com.hotelmanagement.entity.PayslipRecord;
import com.hotelmanagement.entity.PayrollRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PayslipRecordRepository extends JpaRepository<PayslipRecord, Long> {
    Optional<PayslipRecord> findByPayroll(PayrollRecord payroll);
}
