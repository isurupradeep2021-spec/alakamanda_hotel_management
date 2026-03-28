package com.hotelmanagement.repository;

import com.hotelmanagement.entity.DiningBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiningBookingRepository extends JpaRepository<DiningBooking, Long> {
    List<DiningBooking> findByContactContainingIgnoreCaseOrderByBookingDateTimeDesc(String contact);

    List<DiningBooking> findTop30ByOrderByBookingDateTimeDesc();
}
