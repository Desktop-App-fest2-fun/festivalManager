package fun.fest2.event;

import fun.fest2.configuration.BatchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@RestController
//@RequestMapping("${spring.mvc.servlet.path}/events")
@RequestMapping("/api/v1/events/batch")
public class EventController {

    private static final Logger logger = LoggerFactory.getLogger(EventController.class);

   /* @Value("${api.base.url}")
    private String apiBaseUrl;

    @Value("${api.key}")
    private String apiKey;*/

   /* @GetMapping("/config")
    public String getConfig() {
        return "Base URL: " + apiBaseUrl + ", API Key: " + apiKey.substring(0, 5) + "...";
    }*/

    private final EventService eventService;

    @Autowired
    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/all")
    public List<EventItem> getAllEvents() {
        return eventService.findAll();
    }

    @PostMapping("/create")
    public ResponseEntity<BatchResponse> createBatch(@RequestBody List<EventItem> events) {
        LocalDateTime startTime = LocalDateTime.now();
        logger.info("Received batch request with {} events", events != null ? events.size() : 0);

        if (events == null || events.isEmpty()) {
            LocalDateTime errorTime = LocalDateTime.now();
            logger.warn("Empty payload received");
            return ResponseEntity.badRequest()
                    .body(new BatchResponse("Empty payload",
                            errorTime,
                            HttpStatus.BAD_REQUEST));
        }

        try {
            logger.debug("Processing batch: {}", events);
            List<EventItem> savedEvents = eventService.batchSave(events);
            LocalDateTime endTime = LocalDateTime.now();

            logger.info("Successfully processed {} events in {} ms",
                    savedEvents.size(),
                    Duration.between(startTime, endTime).toMillis());

            return ResponseEntity.ok()
                    .body(new BatchResponse("Batch processed successfully",
                            savedEvents.size(),
                            startTime,
                            endTime));
        } catch (Exception e) {
            LocalDateTime errorTime = LocalDateTime.now();
            logger.error("Batch processing failed after {} ms",
                    Duration.between(startTime, errorTime).toMillis(), e);

            return ResponseEntity.internalServerError()
                    .body(new BatchResponse(e.getMessage(),
                            errorTime,
                            HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }


    @DeleteMapping("/delete/by-event")
    public ResponseEntity<BatchResponse> deleteByEventId(
            @RequestParam String eventId) {

        LocalDateTime startTime = LocalDateTime.now();

        try {
            int deletedCount = eventService.deleteByEventId(eventId);
            LocalDateTime endTime = LocalDateTime.now();

            return ResponseEntity.ok()
                    .body(new BatchResponse(
                            "Deleted " + deletedCount + " operations for eventId: " + eventId,
                            deletedCount,
                            startTime,
                            endTime));
        } catch (Exception e) {
            LocalDateTime errorTime = LocalDateTime.now();
            logger.error("Delete failed for eventId: {}", eventId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new BatchResponse(
                            e.getMessage(),
                            errorTime,
                            HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }





}
