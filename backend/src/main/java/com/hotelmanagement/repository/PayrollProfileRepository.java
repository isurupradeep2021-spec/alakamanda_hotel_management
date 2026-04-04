package com.hotelmanagement.repository;

import com.hotelmanagement.entity.ContractType;
import com.hotelmanagement.entity.PayCycle;
import com.hotelmanagement.entity.PayrollProfile;
import com.hotelmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayrollProfileRepository extends JpaRepository<PayrollProfile, Long> {
    Optional<PayrollProfile> findByUser(User user);
    Optional<PayrollProfile> findByEmployeeCode(String employeeCode);
    void deleteByUser(User user);

    List<PayrollProfile> findByArchivedFalseAndActiveTrue();
    List<PayrollProfile> findByArchivedFalseAndActiveTrueAndPayCycle(PayCycle payCycle);
    List<PayrollProfile> findByArchivedFalseAndActiveTrueAndContractType(ContractType contractType);

    List<PayrollProfile> findByEmployeeNameContainingIgnoreCaseAndArchivedFalse(String employeeName);
    List<PayrollProfile> findByDepartmentContainingIgnoreCaseAndArchivedFalse(String department);
}
