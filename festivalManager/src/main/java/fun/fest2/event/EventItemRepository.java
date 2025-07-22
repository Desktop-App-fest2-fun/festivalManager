package fun.fest2.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class EventItemRepository {

    private static final Logger logger = LoggerFactory.getLogger(EventItemRepository.class);
    private final DynamoDbTable<EventItem> eventItemTable;

    @Autowired
    public EventItemRepository(DynamoDbEnhancedClient enhancedClient) {
        this.eventItemTable = enhancedClient.table("events", TableSchema.fromBean(EventItem.class));
    }

    public void updateSync(String eventId, String modifiedOperation) {
        try {
            // Create sync item
            EventItem syncItem = new EventItem(eventId, "sync");

            // Fetch existing sync item to preserve timestamps
            Key key = Key.builder()
                    .partitionValue(eventId)
                    .sortValue("sync")
                    .build();
            EventItem existingSync = eventItemTable.getItem(key);

            // Build data with timestamps
            Map<String, Object> data = new HashMap<>();
            Map<String, String> timestamps = new HashMap<>();
            if (existingSync != null && existingSync.getData() != null && existingSync.getData().get("timestamps") != null) {
                @SuppressWarnings("unchecked")
                Map<String, String> existingTimestamps = (Map<String, String>) existingSync.getData().get("timestamps");
                timestamps.putAll(existingTimestamps);
            }
            timestamps.put(modifiedOperation, Instant.now().toString());
            data.put("timestamps", timestamps);
            syncItem.setData(data);

            // Save sync item
            eventItemTable.putItem(syncItem);
            logger.info("Updated sync item: eventId={}, operation=sync, modifiedOperation={}", eventId, modifiedOperation);
        } catch (Exception e) {
            logger.error("Failed to update sync item: eventId={}, operation=sync, modifiedOperation={}: {}",
                    eventId, modifiedOperation, e.getMessage());
            // Non-blocking: log error but don’t throw
        }
    }

        /*Map<String, Map<String, String>> syncUpdates = new HashMap<>();
        itemsToWrite.forEach(item -> {
            syncUpdates.computeIfAbsent(item.getEventId(), k -> new HashMap<>())
                    .put(item.getOperation(), Instant.now().toString());
        });
    s       yncUpdates.forEach((eventId, timestamps) -> {
            EventItem syncItem = new EventItem(eventId, "sync");
            Map<String, Object> data = new HashMap<>();
            data.put("timestamps", timestamps);
            syncItem.setData(data);
            eventItemTable.putItem(syncItem);
        });*/

    public List<EventItem> findAll() {
        try {
            List<EventItem> items = eventItemTable.scan()
                    .items()
                    .stream()
                    .collect(Collectors.toList());
            logger.info("Fetched {} items from DynamoDB (full scan)", items.size());
            return items;
        } catch (Exception e) {
            logger.error("Failed to scan all items", e);
            throw new RuntimeException("Error scanning EventItems: " + e.getMessage());
        }
    }

    public void save(EventItem eventItem) {
        if (eventItem == null || eventItem.getEventId() == null || eventItem.getOperation() == null) {
            logger.error("Invalid EventItem: null or missing keys");
            throw new IllegalArgumentException("EventItem and its keys are required");
        }

        try {
            eventItemTable.putItem(eventItem);
            logger.info("Saved EventItem: eventId={}, operation={}", eventItem.getEventId(), eventItem.getOperation());
            updateSync(eventItem.getEventId(), eventItem.getOperation());
        } catch (Exception e) {
            logger.error("Failed to save EventItem: eventId={}, operation={}",
                    eventItem.getEventId(), eventItem.getOperation(), e);
            throw new RuntimeException("Error saving EventItem: " + e.getMessage());
        }
    }

    public List<EventItem> findByEventId(String eventId) {
        if (eventId == null || eventId.trim().isEmpty()) {
            logger.error("Invalid eventId: null or empty");
            throw new IllegalArgumentException("eventId is required");
        }

        try {
            Key key = Key.builder().partitionValue(eventId).build();
            List<EventItem> items = eventItemTable.query(QueryConditional.keyEqualTo(key))
                    .items()
                    .stream()
                    .collect(Collectors.toList());

            logger.info("Found {} items for eventId={}", items.size(), eventId);
            return items;
        } catch (Exception e) {
            logger.error("Failed to query items for eventId={}", eventId, e);
            throw new RuntimeException("Error querying EventItems: " + e.getMessage());
        }
    }

    public Optional<EventItem> findByEventIdAndOperation(String eventId, String operation) {
        if (eventId == null || eventId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: eventId or operation is null/empty");
            throw new IllegalArgumentException("eventId and operation are required");
        }

        try {
            Key key = Key.builder()
                    .partitionValue(eventId)
                    .sortValue(operation)
                    .build();
            EventItem item = eventItemTable.getItem(key);

            if (item != null) {
                logger.info("Found EventItem: eventId={}, operation={}", eventId, operation);
                return Optional.of(item);
            } else {
                logger.info("No EventItem found for eventId={}, operation={}", eventId, operation);
                return Optional.empty();
            }
        } catch (Exception e) {
            logger.error("Failed to fetch EventItem: eventId={}, operation={}", eventId, operation, e);
            throw new RuntimeException("Error fetching EventItem: " + e.getMessage());
        }
    }

    public void delete(String eventId, String operation) {
        if (eventId == null || eventId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: eventId or operation is null/empty");
            throw new IllegalArgumentException("eventId and operation are required");
        }

        try {
            Key key = Key.builder()
                    .partitionValue(eventId)
                    .sortValue(operation)
                    .build();
            eventItemTable.deleteItem(key);
            logger.info("Deleted EventItem: eventId={}, operation={}", eventId, operation);
            updateSync(eventId, operation);
        } catch (Exception e) {
            logger.error("Failed to delete EventItem: eventId={}, operation={}", eventId, operation, e);
            throw new RuntimeException("Error deleting EventItem: " + e.getMessage());
        }
    }

    public void batchSave(List<EventItem> items) {
        if (items == null || items.isEmpty()) {
            logger.warn("Empty batch save request");
            return;
        }

        try {
            List<EventItem> itemsToWrite = items.stream()
                    .filter(item -> item != null && item.getEventId() != null && item.getOperation() != null)
                    .toList();

            if (itemsToWrite.size() < items.size()) {
                logger.warn("Filtered out {} invalid items from batch", items.size() - itemsToWrite.size());
            }

            itemsToWrite.forEach(eventItemTable::putItem);
            itemsToWrite.forEach(item -> updateSync(item.getEventId(), item.getOperation()));

            logger.info("Successfully batch saved {} items", itemsToWrite.size());
        } catch (Exception e) {
            logger.error("Batch save operation failed", e);
            throw new RuntimeException("Batch save failed: " + e.getMessage(), e);
        }
    }

    public void batchDelete(List<EventItem> items) {
        if (items == null || items.isEmpty()) {
            logger.warn("Empty batch delete request");
            return;
        }

        try {
            List<EventItem> validItems = items.stream()
                    .filter(item -> item != null && item.getEventId() != null && item.getOperation() != null)
                    .collect(Collectors.toList());

            if (validItems.size() < items.size()) {
                logger.warn("Filtered out {} invalid items from batch delete", items.size() - validItems.size());
            }

            validItems.forEach(item -> {
                Key key = Key.builder()
                        .partitionValue(item.getEventId())
                        .sortValue(item.getOperation())
                        .build();
                eventItemTable.deleteItem(key);
                updateSync(item.getEventId(), item.getOperation());
            });

            logger.info("Successfully batch deleted {} items", validItems.size());
        } catch (Exception e) {
            logger.error("Batch delete operation failed", e);
            throw new RuntimeException("Batch delete failed: " + e.getMessage(), e);
        }
    }
}