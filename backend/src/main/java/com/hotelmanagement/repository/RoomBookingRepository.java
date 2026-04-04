package com.hotelmanagement.repository;

import com.hotelmanagement.entity.RoomBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RoomBookingRepository extends JpaRepository<RoomBooking, Long> {
    List<RoomBooking> findByRoomNumber(String roomNumber);

    List<RoomBooking> findByRoomNumberAndIdNot(String roomNumber, Long id);

    List<RoomBooking> findByCheckInDateBetweenOrCheckOutDateBetween(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2);

    List<RoomBooking> findByCustomerEmailIgnoreCaseOrderByCheckInDateDesc(String customerEmail);

    @Query("""
            SELECT CASE WHEN COUNT(rb) > 0 THEN true ELSE false END
            FROM RoomBooking rb
            WHERE rb.roomNumber = :roomNumber
              AND UPPER(COALESCE(rb.status, 'CONFIRMED')) <> 'CANCELLED'
              AND rb.checkInDate < :checkOutDate
              AND rb.checkOutDate > :checkInDate
            """)
    boolean existsActiveOverlap(@Param("roomNumber") String roomNumber,
                                @Param("checkInDate") LocalDate checkInDate,
                                @Param("checkOutDate") LocalDate checkOutDate);

    @Query("""
            SELECT CASE WHEN COUNT(rb) > 0 THEN true ELSE false END
            FROM RoomBooking rb
            WHERE rb.roomNumber = :roomNumber
              AND rb.id <> :excludeId
              AND UPPER(COALESCE(rb.status, 'CONFIRMED')) <> 'CANCELLED'
              AND rb.checkInDate < :checkOutDate
              AND rb.checkOutDate > :checkInDate
            """)
    boolean existsActiveOverlapExcludingId(@Param("roomNumber") String roomNumber,
                                           @Param("checkInDate") LocalDate checkInDate,
                                           @Param("checkOutDate") LocalDate checkOutDate,
                                           @Param("excludeId") Long excludeId);
}
