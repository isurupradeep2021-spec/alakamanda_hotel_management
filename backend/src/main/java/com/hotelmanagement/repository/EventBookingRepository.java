package com.hotelmanagement.repository;

import com.hotelmanagement.entity.EventBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EventBookingRepository extends JpaRepository<EventBooking, Long> {
    List<EventBooking> findByHallNameAndEventDateTimeBetween(String hallName, LocalDateTime start, LocalDateTime end);

    List<EventBooking> findByHallNameAndIdNot(String hallName, Long id);

    List<EventBooking> findByCustomerNameContainingIgnoreCaseOrderByEventDateTimeDesc(String customerName);
}
