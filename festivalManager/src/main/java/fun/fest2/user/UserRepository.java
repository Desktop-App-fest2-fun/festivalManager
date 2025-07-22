package fun.fest2.user;

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
public class UserRepository {

    private static final Logger logger = LoggerFactory.getLogger(UserRepository.class);
    private final DynamoDbTable<User> userTable;

    @Autowired
    public UserRepository(DynamoDbEnhancedClient enhancedClient) {
        this.userTable = enhancedClient.table("users", TableSchema.fromBean(User.class));
    }

    public void updateSync(String userId, String modifiedOperation) {
        try {
            // Create sync item
            User syncItem = new User(userId, "sync");

            // Fetch existing sync item to preserve timestamps
            Key key = Key.builder()
                    .partitionValue(userId)
                    .sortValue("sync")
                    .build();
            User existingSync = userTable.getItem(key);

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
            userTable.putItem(syncItem);
            logger.info("Updated sync item: userId={}, operation=sync, modifiedOperation={}", userId, modifiedOperation);
        } catch (Exception e) {
            logger.error("Failed to update sync item: userId={}, operation=sync, modifiedOperation={}: {}",
                    userId, modifiedOperation, e.getMessage());
            // Non-blocking: log error but don’t throw
        }
    }

    public List<User> findAll() {
        try {
            List<User> items = userTable.scan()
                    .items()
                    .stream()
                    .collect(Collectors.toList());
            logger.info("Fetched {} users from DynamoDB (full scan)", items.size());
            return items;
        } catch (Exception e) {
            logger.error("Failed to scan all users", e);
            throw new RuntimeException("Error scanning Users: " + e.getMessage());
        }
    }

    public void save(User user) {
        if (user == null || user.getUserId() == null || user.getOperation() == null) {
            logger.error("Invalid User: null or missing keys");
            throw new IllegalArgumentException("User and its keys are required");
        }

        try {
            userTable.putItem(user);
            logger.info("Saved User: userId={}, operation={}", user.getUserId(), user.getOperation());
            updateSync(user.getUserId(), user.getOperation());
        } catch (Exception e) {
            logger.error("Failed to save User: userId={}, operation={}", user.getUserId(), user.getOperation(), e);
            throw new RuntimeException("Error saving User: " + e.getMessage());
        }
    }

    public List<User> findByUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Invalid userId: null or empty");
            throw new IllegalArgumentException("userId is required");
        }

        try {
            Key key = Key.builder().partitionValue(userId).build();
            List<User> items = userTable.query(QueryConditional.keyEqualTo(key))
                    .items()
                    .stream()
                    .collect(Collectors.toList());

            logger.info("Found {} users for userId={}", items.size(), userId);
            return items;
        } catch (Exception e) {
            logger.error("Failed to query users for userId={}", userId, e);
            throw new RuntimeException("Error querying Users: " + e.getMessage());
        }
    }

  /*  Map<String, Map<String, String>> syncUpdates = new HashMap<>();
itemsToWrite.forEach(item -> {
        syncUpdates.computeIfAbsent(item.getUserId(), k -> new HashMap<>())
                .put(item.getOperation(), Instant.now().toString());
    });
syncUpdates.forEach((userId, timestamps) -> {
        User syncItem = new User(userId, "sync");
        Map<String, Object> data = new HashMap<>();
        data.put("timestamps", timestamps);
        syncItem.setData(data);
        userTable.putItem(syncItem);
    });*/

    public Optional<User> findByUserIdAndOperation(String userId, String operation) {
        if (userId == null || userId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: userId or operation is null/empty");
            throw new IllegalArgumentException("userId and operation are required");
        }

        try {
            Key key = Key.builder()
                    .partitionValue(userId)
                    .sortValue(operation)
                    .build();
            User item = userTable.getItem(key);

            if (item != null) {
                logger.info("Found User: userId={}, operation={}", userId, operation);
                return Optional.of(item);
            } else {
                logger.info("No User found for userId={}, operation={}", userId, operation);
                return Optional.empty();
            }
        } catch (Exception e) {
            logger.error("Failed to fetch User: userId={}, operation={}", userId, operation, e);
            throw new RuntimeException("Error fetching User: " + e.getMessage());
        }
    }

    public void delete(String userId, String operation) {
        if (userId == null || userId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: userId or operation is null/empty");
            throw new IllegalArgumentException("userId and operation are required");
        }

        try {
            Key key = Key.builder()
                    .partitionValue(userId)
                    .sortValue(operation)
                    .build();
            userTable.deleteItem(key);
            logger.info("Deleted User: userId={}, operation={}", userId, operation);
            updateSync(userId, operation);
        } catch (Exception e) {
            logger.error("Failed to delete User: userId={}, operation={}", userId, operation, e);
            throw new RuntimeException("Error deleting User: " + e.getMessage());
        }
    }

    public void batchSave(List<User> items) {
        if (items == null || items.isEmpty()) {
            logger.warn("Empty batch save request");
            return;
        }

        try {
            List<User> itemsToWrite = items.stream()
                    .filter(item -> item != null && item.getUserId() != null && item.getOperation() != null)
                    .toList();

            if (itemsToWrite.size() < items.size()) {
                logger.warn("Filtered out {} invalid users from batch", items.size() - itemsToWrite.size());
            }

            itemsToWrite.forEach(userTable::putItem);
            itemsToWrite.forEach(item -> updateSync(item.getUserId(), item.getOperation()));

            logger.info("Successfully batch saved {} users", itemsToWrite.size());
        } catch (Exception e) {
            logger.error("Batch save operation failed", e);
            throw new RuntimeException("Batch save failed: " + e.getMessage(), e);
        }
    }

    public void batchDelete(List<User> items) {
        if (items == null || items.isEmpty()) {
            logger.warn("Empty batch delete request");
            return;
        }

        try {
            List<User> validItems = items.stream()
                    .filter(item -> item != null && item.getUserId() != null && item.getOperation() != null)
                    .toList();

            if (validItems.size() < items.size()) {
                logger.warn("Filtered out {} invalid users from batch delete", items.size() - validItems.size());
            }

            validItems.forEach(item -> {
                Key key = Key.builder()
                        .partitionValue(item.getUserId())
                        .sortValue(item.getOperation())
                        .build();
                userTable.deleteItem(key);
                updateSync(item.getUserId(), item.getOperation());
            });

            logger.info("Successfully batch deleted {} users", validItems.size());
        } catch (Exception e) {
            logger.error("Batch delete operation failed", e);
            throw new RuntimeException("Batch delete failed: " + e.getMessage(), e);
        }
    }
}