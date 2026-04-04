package com.hotelmanagement.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelmanagement.entity.PayrollAuditLog;
import com.hotelmanagement.repository.PayrollAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PayrollAuditService {

    private final PayrollAuditLogRepository payrollAuditLogRepository;
    private final ObjectMapper objectMapper;

    public void log(String entityType, Long entityId, String action, Object oldValue, Object newValue) {
        String actor = "SYSTEM";
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            actor = SecurityContextHolder.getContext().getAuthentication().getName();
        }

        PayrollAuditLog log = PayrollAuditLog.builder()
                .entityType(entityType)
                .entityId(entityId == null ? 0L : entityId)
                .action(action)
                .changedBy(actor)
                .oldValue(toJson(oldValue))
                .newValue(toJson(newValue))
                .changedAt(LocalDateTime.now())
                .build();
        payrollAuditLogRepository.save(log);
    }

    public List<PayrollAuditLog> list(LocalDateTime from, LocalDateTime to) {
        if (from != null && to != null) {
            return payrollAuditLogRepository.findByChangedAtBetweenOrderByChangedAtDesc(from, to);
        }
        return payrollAuditLogRepository.findAll().stream()
                .sorted((a, b) -> b.getChangedAt().compareTo(a.getChangedAt()))
                .toList();
    }

    private String toJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return String.valueOf(value);
        }
    }
}
