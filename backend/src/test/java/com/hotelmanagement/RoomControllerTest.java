package com.hotelmanagement;

import com.hotelmanagement.controller.RoomController;
import com.hotelmanagement.entity.Room;
import com.hotelmanagement.entity.RoomBooking;
import com.hotelmanagement.repository.RoomBookingRepository;
import com.hotelmanagement.repository.RoomRepository;
import com.hotelmanagement.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RoomController.class)
@AutoConfigureMockMvc(addFilters = false)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomRepository roomRepository;

    @MockBean
    private RoomBookingRepository roomBookingRepository;

        @MockBean
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @MockBean
        private UserDetailsService userDetailsService;

    @Test
    void availabilityShouldReturnOnlyRoomsWithoutDateOverlap() throws Exception {
        Room room101 = Room.builder()
                .id(1L)
                .roomNumber("101")
                .roomType("Deluxe")
                .pricePerNight(java.math.BigDecimal.valueOf(18000))
                .available(true)
                .status("AVAILABLE")
                .build();

        Room room102 = Room.builder()
                .id(2L)
                .roomNumber("102")
                .roomType("Suite")
                .pricePerNight(java.math.BigDecimal.valueOf(22000))
                .available(true)
                .status("AVAILABLE")
                .build();

        RoomBooking overlapBooking = RoomBooking.builder()
                .id(100L)
                .roomNumber("101")
                .checkInDate(LocalDate.parse("2026-04-11"))
                .checkOutDate(LocalDate.parse("2026-04-13"))
                .status("CONFIRMED")
                .build();

        when(roomRepository.findAll()).thenReturn(List.of(room101, room102));
        when(roomBookingRepository.findByRoomNumber("101")).thenReturn(List.of(overlapBooking));
        when(roomBookingRepository.findByRoomNumber("102")).thenReturn(List.of());

        mockMvc.perform(get("/api/rooms/availability")
                        .param("checkIn", "2026-04-12")
                        .param("checkOut", "2026-04-14"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRooms").value(2))
                .andExpect(jsonPath("$.availableRooms").value(1));
    }

    @Test
    void completeCleaningShouldSetRoomToAvailable() throws Exception {
        Room cleaningRoom = Room.builder()
                .id(1L)
                .roomNumber("101")
                .roomType("Deluxe")
                .pricePerNight(java.math.BigDecimal.valueOf(18000))
                .available(false)
                .status("CLEANING")
                .build();

        when(roomRepository.findById(1L)).thenReturn(Optional.of(cleaningRoom));
        when(roomRepository.save(cleaningRoom)).thenReturn(cleaningRoom);

        mockMvc.perform(post("/api/rooms/1/complete-cleaning")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.available").value(true));

        verify(roomRepository).save(cleaningRoom);
    }
}
