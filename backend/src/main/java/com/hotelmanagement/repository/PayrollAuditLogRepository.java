package com.hotelmanagement.repository;

import com.hotelmanagement.entity.PayrollAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PayrollAuditLogRepository extends JpaRepository<PayrollAuditLog, Long> {
    List<PayrollAuditLog> findByEntityTypeAndEntityIdOrderByChangedAtDesc(String entityType, Long entityId);
    List<PayrollAuditLog> findByChangedAtBetweenOrderByChangedAtDesc(LocalDateTime from, LocalDateTime to);
}
