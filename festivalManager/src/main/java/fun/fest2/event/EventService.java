package fun.fest2.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;


@Service
public class EventService {

    private static final int MAX_BATCH_SIZE = 25;
    private static final Logger logger = LoggerFactory.getLogger(EventService.class);
    private final EventItemRepository repository;

    @Autowired
    public EventService(EventItemRepository repository) {
        this.repository = repository;
    }

    public void save(EventItem eventItem) {
        repository.save(eventItem);
    }

    public List<EventItem> findAll() {
        try {
            List<EventItem> items = repository.findAll();
            logger.info("Fetched {} items from DynamoDB", items.size());
            return items;
        } catch (Exception e) {
            logger.error("Error fetching all items", e);
            throw new RuntimeException("Failed to fetch all events: " + e.getMessage());
        }
    }

    public List<EventItem> findByEventId(String eventId) {
        if (eventId == null || eventId.trim().isEmpty()) {
            logger.error("Invalid eventId: null or empty");
            throw new IllegalArgumentException("eventId is required");
        }

        try {
            List<EventItem> items = repository.findByEventId(eventId); // Query by partition key
            logger.info("Fetched {} items for eventId={}", items.size(), eventId);
            return items;
        } catch (Exception e) {
            logger.error("Error fetching items for eventId={}", eventId, e);
            throw new RuntimeException("Failed to fetch event items: " + e.getMessage());
        }
    }

    public EventItem findByEventIdAndOperation(String eventId, String operation) {
        if (eventId == null || eventId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: eventId or operation is null/empty");
            throw new IllegalArgumentException("eventId and operation are required");
        }

        try {
            Optional<EventItem> item = repository.findByEventIdAndOperation(eventId, operation);
            if (item.isPresent()) {
                logger.info("Found item for eventId={}, operation={}", eventId, operation);
                return item.get();
            } else {
                logger.info("No item found for eventId={}, operation={}", eventId, operation);
                return null;
            }
        } catch (Exception e) {
            logger.error("Error fetching item for eventId={}, operation={}", eventId, operation, e);
            throw new RuntimeException("Failed to fetch event item: " + e.getMessage());
        }
    }

    public void delete(String eventId, String operation) {
        if (eventId == null || eventId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: eventId or operation is null/empty");
            throw new IllegalArgumentException("eventId and operation are required");
        }

        try {
            repository.delete(eventId, operation);
            logger.info("Deleted eventItem: eventId={}, operation={}", eventId, operation);
        } catch (Exception e) {
            logger.error("Error deleting eventItem: eventId={}, operation={}", eventId, operation, e);
            throw new RuntimeException("Failed to delete event item: " + e.getMessage());
        }
    }

    public int deleteByEventId(String eventId) {
        if (eventId == null || eventId.trim().isEmpty()) {
            logger.error("Invalid eventId: null or empty");
            throw new IllegalArgumentException("eventId is required");
        }

        try {
            // 1. Find all operations for this eventId
            List<EventItem> operations = repository.findByEventId(eventId);

            if (operations.isEmpty()) {
                logger.info("No operations found for eventId: {}", eventId);
                return 0;
            }

            // 2. Delete in batches
            List<List<EventItem>> chunks = partitionList(operations);
            chunks.forEach(repository::batchDelete);

            logger.info("Deleted {} operations for eventId: {}", operations.size(), eventId);
            return operations.size();
        } catch (Exception e) {
            logger.error("Failed to delete operations for eventId: {}", eventId, e);
            throw new RuntimeException("Delete operation failed: " + e.getMessage());
        }
    }

    public List<EventItem> batchSave(List<EventItem> items) {
        try {
            List<List<EventItem>> chunks = partitionList(items);
            chunks.forEach(repository::batchSave);
            logger.info("Successfully saved {} items in batches", items.size());
        } catch (Exception e) {
            logger.error("Batch save failed", e);
            throw new RuntimeException("Batch operation failed: " + e.getMessage());
        }
        return items;
    }

    private <T> List<List<T>> partitionList(List<T> list) {
        int numChunks = (int) Math.ceil((double) list.size() / EventService.MAX_BATCH_SIZE);
        List<List<T>> chunks = new java.util.ArrayList<>(numChunks);
        for (int i = 0; i < numChunks; i++) {
            int start = i * EventService.MAX_BATCH_SIZE;
            int end = Math.min((i + 1) * EventService.MAX_BATCH_SIZE, list.size());
            chunks.add(list.subList(start, end));
        }
        return chunks;
    }
}