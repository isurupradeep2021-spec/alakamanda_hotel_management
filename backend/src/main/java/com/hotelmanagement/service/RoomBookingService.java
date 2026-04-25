package com.hotelmanagement.service;

import com.hotelmanagement.dto.RoomBookingRequest;
import com.hotelmanagement.dto.RoomBookingResponse;

import java.util.List;
import java.util.Map;

public interface RoomBookingService {
    List<RoomBookingResponse> getAllBookings();

    RoomBookingResponse createBooking(RoomBookingRequest request);

    RoomBookingResponse updateBooking(Long bookingId, RoomBookingRequest request);

    void deleteBooking(Long bookingId);

    Map<String, Object> getBookingAnalytics();
}
