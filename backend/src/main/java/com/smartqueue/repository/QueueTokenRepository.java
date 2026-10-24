package com.smartqueue.repository;

import com.smartqueue.model.QueueToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface QueueTokenRepository extends JpaRepository<QueueToken, Long> {
    List<QueueToken> findByQueueDateOrderByIdAsc(LocalDate queueDate);
    List<QueueToken> findByQueueDateAndDepartmentOrderByIdAsc(LocalDate queueDate, String department);
    Optional<QueueToken> findFirstByQueueDateAndStatusOrderByIdAsc(LocalDate queueDate, String status);
    Optional<QueueToken> findFirstByQueueDateAndDepartmentAndStatusOrderByIdAsc(
        LocalDate queueDate, String department, String status);
    long countByQueueDateAndDepartment(LocalDate queueDate, String department);
}
