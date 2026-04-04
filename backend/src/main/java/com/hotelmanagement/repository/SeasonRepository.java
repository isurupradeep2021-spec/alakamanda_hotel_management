package com.hotelmanagement.repository;

import com.hotelmanagement.entity.Season;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SeasonRepository extends JpaRepository<Season, Long> {
    
    @Query("SELECT s FROM Season s WHERE s.active = true AND s.startDate <= :date AND s.endDate >= :date")
    Optional<Season> findByDateAndActive(@Param("date") LocalDate date);
    
    @Query("SELECT s FROM Season s WHERE s.active = true ORDER BY s.startDate ASC")
    List<Season> findAllActive();
}
