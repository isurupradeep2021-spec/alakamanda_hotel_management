package com.hotelmanagement.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatbotResponseDto {
    private String role;
    private String question;
    private String answer;
}
