package com.hotelmanagement.repository;

import com.hotelmanagement.entity.EventBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventBookingRepository extends JpaRepository<EventBooking, Long> {
    List<EventBooking> findByHallNameIgnoreCase(String hallName);

    List<EventBooking> findByHallNameIgnoreCaseAndIdNot(String hallName, Long id);

    List<EventBooking> findByCustomerNameContainingIgnoreCaseOrderByEventDateTimeDesc(String customerName);

    List<EventBooking> findByCustomerEmailContainingIgnoreCaseOrderByEventDateTimeDesc(String customerEmail);
}
