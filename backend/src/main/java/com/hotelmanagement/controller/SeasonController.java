package com.hotelmanagement.controller;

import com.hotelmanagement.entity.Season;
import com.hotelmanagement.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seasons")
@RequiredArgsConstructor
public class SeasonController {

    private final SeasonRepository seasonRepository;

    @GetMapping
    public List<Season> getAll() {
        return seasonRepository.findAll();
    }

    @GetMapping("/active")
    public List<Season> getActive() {
        return seasonRepository.findAllActive();
    }

    @GetMapping("/{id}")
    public Season getById(@PathVariable Long id) {
        return seasonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Season not found"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Season create(@RequestBody Season season) {
        return seasonRepository.save(season);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Season update(@PathVariable Long id, @RequestBody Season season) {
        Season existing = seasonRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Season not found"));
        
        existing.setSeasonName(season.getSeasonName());
        existing.setStartDate(season.getStartDate());
        existing.setEndDate(season.getEndDate());
        existing.setPriceMultiplier(season.getPriceMultiplier());
        existing.setDescription(season.getDescription());
        existing.setActive(season.isActive());
        
        return seasonRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        seasonRepository.deleteById(id);
    }
}
