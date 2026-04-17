package com.hotelmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatbotRequestDto {
    @NotBlank
    private String question;
}
