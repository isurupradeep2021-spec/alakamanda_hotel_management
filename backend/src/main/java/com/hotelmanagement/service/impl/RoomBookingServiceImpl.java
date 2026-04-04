package com.hotelmanagement.service.impl;

import com.hotelmanagement.dto.RoomBookingRequest;
import com.hotelmanagement.dto.RoomBookingResponse;
import com.hotelmanagement.entity.Room;
import com.hotelmanagement.entity.RoomBooking;
import com.hotelmanagement.exception.BookingConflictException;
import com.hotelmanagement.exception.BookingNotFoundException;
import com.hotelmanagement.exception.InvalidBookingException;
import com.hotelmanagement.exception.RoomNotFoundException;
import com.hotelmanagement.repository.RoomBookingRepository;
import com.hotelmanagement.repository.RoomRepository;
import com.hotelmanagement.service.RoomBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RoomBookingServiceImpl implements RoomBookingService {

    private static final String DEFAULT_STATUS = "CONFIRMED";
    private static final String CANCELLED_STATUS = "CANCELLED";

    private final RoomBookingRepository roomBookingRepository;
    private final RoomRepository roomRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RoomBookingResponse> getAllBookings() {
        return roomBookingRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RoomBookingResponse createBooking(RoomBookingRequest request) {
        validateBookingDates(request.getCheckInDate(), request.getCheckOutDate());

        Room room = findRoomByNumber(request.getRoomNumber());
        validateGuestCapacity(request.getGuestCount(), room.getCapacity());
        validateBookingWindowAvailability(request.getRoomNumber(), request.getCheckInDate(), request.getCheckOutDate(), null);

        RoomBooking booking = new RoomBooking();
        applyRequestToEntity(booking, request);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setStatus(normalizeStatus(request.getStatus()));
        booking.setTotalCost(calculateTotalCost(booking.getCheckInDate(), booking.getCheckOutDate(), room.getPricePerNight()));

        return toResponse(roomBookingRepository.save(booking));
    }

    @Override
    @Transactional
    public RoomBookingResponse updateBooking(Long bookingId, RoomBookingRequest request) {
        RoomBooking booking = roomBookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Room booking not found"));

        validateBookingDates(request.getCheckInDate(), request.getCheckOutDate());

        Room room = findRoomByNumber(request.getRoomNumber());
        validateGuestCapacity(request.getGuestCount(), room.getCapacity());
        validateBookingWindowAvailability(request.getRoomNumber(), request.getCheckInDate(), request.getCheckOutDate(), bookingId);

        applyRequestToEntity(booking, request);
        booking.setStatus(normalizeStatus(request.getStatus()));
        booking.setTotalCost(calculateTotalCost(booking.getCheckInDate(), booking.getCheckOutDate(), room.getPricePerNight()));

        return toResponse(roomBookingRepository.save(booking));
    }

    @Override
    @Transactional
    public void deleteBooking(Long bookingId) {
        if (!roomBookingRepository.existsById(bookingId)) {
            throw new BookingNotFoundException("Room booking not found");
        }
        roomBookingRepository.deleteById(bookingId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBookingAnalytics() {
        List<RoomBooking> bookings = roomBookingRepository.findAll();
        long activeBookings = bookings.stream()
                .filter(booking -> !CANCELLED_STATUS.equalsIgnoreCase(booking.getStatus()))
                .count();
        BigDecimal totalRevenue = bookings.stream()
                .map(booking -> booking.getTotalCost() == null ? BigDecimal.ZERO : booking.getTotalCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "totalBookings", bookings.size(),
                "activeBookings", activeBookings,
                "totalRevenue", totalRevenue
        );
    }

    private void validateBookingDates(LocalDate checkInDate, LocalDate checkOutDate) {
        if (checkInDate == null || checkOutDate == null) {
            throw new InvalidBookingException("Check-in and check-out dates are required");
        }
        if (!checkOutDate.isAfter(checkInDate)) {
            throw new InvalidBookingException("Check-out date must be after check-in date");
        }
    }

    private Room findRoomByNumber(String roomNumber) {
        return roomRepository.findByRoomNumber(roomNumber)
                .orElseThrow(() -> new RoomNotFoundException("Room not found"));
    }

    private void validateGuestCapacity(Integer guestCount, Integer roomCapacity) {
        if (guestCount == null || guestCount < 1) {
            throw new InvalidBookingException("Guest count must be at least 1");
        }
        if (roomCapacity != null && guestCount > roomCapacity) {
            throw new InvalidBookingException("Guest count exceeds room capacity");
        }
    }

    private void validateBookingWindowAvailability(String roomNumber, LocalDate checkInDate, LocalDate checkOutDate, Long currentBookingId) {
        boolean hasOverlap = currentBookingId == null
                ? roomBookingRepository.existsActiveOverlap(roomNumber, checkInDate, checkOutDate)
                : roomBookingRepository.existsActiveOverlapExcludingId(roomNumber, checkInDate, checkOutDate, currentBookingId);

        if (hasOverlap) {
            throw new BookingConflictException("This room is already booked for selected dates");
        }
    }

    private String normalizeStatus(String status) {
        return (status == null || status.isBlank()) ? DEFAULT_STATUS : status;
    }

    private BigDecimal calculateTotalCost(LocalDate checkInDate, LocalDate checkOutDate, BigDecimal pricePerNight) {
        BigDecimal nightlyPrice = pricePerNight == null ? BigDecimal.ZERO : pricePerNight;
        long nights = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        if (nights <= 0) {
            return BigDecimal.ZERO;
        }
        return nightlyPrice.multiply(BigDecimal.valueOf(nights));
    }

    private void applyRequestToEntity(RoomBooking booking, RoomBookingRequest request) {
        booking.setCustomerName(request.getCustomerName());
        booking.setCustomerEmail(request.getCustomerEmail());
        booking.setRoomNumber(request.getRoomNumber());
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setGuestCount(request.getGuestCount());
    }

    private RoomBookingResponse toResponse(RoomBooking booking) {
        return RoomBookingResponse.builder()
                .id(booking.getId())
                .customerName(booking.getCustomerName())
                .customerEmail(booking.getCustomerEmail())
                .roomNumber(booking.getRoomNumber())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .guestCount(booking.getGuestCount())
                .totalCost(booking.getTotalCost())
                .createdAt(booking.getCreatedAt())
                .status(booking.getStatus())
                .build();
    }
}
