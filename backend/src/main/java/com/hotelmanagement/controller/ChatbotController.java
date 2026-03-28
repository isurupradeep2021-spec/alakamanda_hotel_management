package com.hotelmanagement.controller;

import com.hotelmanagement.dto.ChatbotRequestDto;
import com.hotelmanagement.dto.ChatbotResponseDto;
import com.hotelmanagement.entity.User;
import com.hotelmanagement.service.PayrollAutomationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final PayrollAutomationService payrollAutomationService;

    @PostMapping("/ask")
    @PreAuthorize("isAuthenticated()")
    public ChatbotResponseDto ask(@Valid @RequestBody ChatbotRequestDto request) {
        User user = payrollAutomationService.getCurrentUser();
        String answer = payrollAutomationService.respondToChatbot(user, request.getQuestion());

        return ChatbotResponseDto.builder()
                .role(user.getRole().name())
                .question(request.getQuestion())
                .answer(answer)
                .build();
    }
}
