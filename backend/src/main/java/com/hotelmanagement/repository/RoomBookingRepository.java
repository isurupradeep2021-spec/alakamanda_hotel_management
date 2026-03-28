package com.hotelmanagement.repository;

import com.hotelmanagement.entity.RoomBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RoomBookingRepository extends JpaRepository<RoomBooking, Long> {
    List<RoomBooking> findByRoomNumber(String roomNumber);

    List<RoomBooking> findByRoomNumberAndIdNot(String roomNumber, Long id);

    List<RoomBooking> findByCheckInDateBetweenOrCheckOutDateBetween(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2);

    List<RoomBooking> findByCustomerEmailIgnoreCaseOrderByCheckInDateDesc(String customerEmail);
}
