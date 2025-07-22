package fun.fest2.configuration;

import org.springframework.http.HttpStatus;

import java.time.Duration;
import java.time.LocalDateTime;

public record BatchResponse(
        String message,
        Integer processedCount,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Duration duration,
        HttpStatus status
) {
    // Constructor for success cases
    public BatchResponse(String message, int count,
                         LocalDateTime startTime, LocalDateTime endTime) {
        this(message,
                count,
                startTime,
                endTime,
                Duration.between(startTime, endTime),
                HttpStatus.OK);
    }

    // Constructor for error cases
    public BatchResponse(String message,
                         LocalDateTime timestamp,
                         HttpStatus status) {
        this(message,
                null,
                timestamp,
                null,
                null,
                status);
    }
}
