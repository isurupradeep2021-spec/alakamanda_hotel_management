package com.hotelmanagement.repository;

import com.hotelmanagement.entity.Room;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    interface RoomBookingCountView {
        String getRoomNumber();
        Long getBookingCount();
    }

    Optional<Room> findByRoomNumber(String roomNumber);

    @Query(value = """
            SELECT r.room_number AS roomNumber,
                   COUNT(rb.id) AS bookingCount
            FROM rooms r
            LEFT JOIN room_bookings rb
                   ON rb.room_number = r.room_number
                  AND (rb.status IS NULL OR UPPER(rb.status) <> 'CANCELLED')
            GROUP BY r.room_number
            ORDER BY bookingCount DESC, r.room_number ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<RoomBookingCountView> findTopBookedRooms(@Param("limit") int limit);

    @Query(value = """
            SELECT r.room_number AS roomNumber,
                   COUNT(rb.id) AS bookingCount
            FROM rooms r
            LEFT JOIN room_bookings rb
                   ON rb.room_number = r.room_number
                  AND (rb.status IS NULL OR UPPER(rb.status) <> 'CANCELLED')
            GROUP BY r.room_number
            ORDER BY bookingCount ASC, r.room_number ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<RoomBookingCountView> findLeastBookedRooms(@Param("limit") int limit);
}
