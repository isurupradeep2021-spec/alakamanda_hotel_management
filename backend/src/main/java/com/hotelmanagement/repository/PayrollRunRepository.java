package com.hotelmanagement.repository;

import com.hotelmanagement.entity.PayCycle;
import com.hotelmanagement.entity.PayrollRun;
import com.hotelmanagement.entity.PayrollRunStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PayrollRunRepository extends JpaRepository<PayrollRun, Long> {
    List<PayrollRun> findByStatus(PayrollRunStatus status);
    List<PayrollRun> findByPayCycleAndStatus(PayCycle payCycle, PayrollRunStatus status);
    List<PayrollRun> findByScheduledDateBetween(LocalDate start, LocalDate end);
    Optional<PayrollRun> findByYearAndMonthAndPayCycle(Integer year, Integer month, PayCycle payCycle);
    Optional<PayrollRun> findByPayCycleAndScheduledDate(PayCycle payCycle, LocalDate scheduledDate);
}
