package fun.fest2.contacts;

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
public class ContactRepository {

    private static final Logger logger = LoggerFactory.getLogger(ContactRepository.class);
    private final DynamoDbTable<Contact> contactTable;

    @Autowired
    public ContactRepository(DynamoDbEnhancedClient enhancedClient) {
        this.contactTable = enhancedClient.table("contacts", TableSchema.fromBean(Contact.class));
    }

    public void updateSync(String contactId, String modifiedOperation) {
        try {
            // Create sync item
            Contact syncItem = new Contact();
            syncItem.setContactId(contactId);
            syncItem.setOperation("sync");

            // Fetch existing sync item to preserve timestamps
            Key key = Key.builder()
                    .partitionValue(contactId)
                    .sortValue("sync")
                    .build();
            Contact existingSync = contactTable.getItem(key);

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
            contactTable.putItem(syncItem);
            logger.info("Updated sync item: contactId={}, operation=sync, modifiedOperation={}", contactId, modifiedOperation);
        } catch (Exception e) {
            logger.error("Failed to update sync item: contactId={}, operation=sync, modifiedOperation={}: {}",
                    contactId, modifiedOperation, e.getMessage());
            // Non-blocking: log error but don’t throw
        }
    }

    public List<Contact> findAll() {
        try {
            List<Contact> items = contactTable.scan()
                    .items()
                    .stream()
                    .collect(Collectors.toList());
            logger.info("Fetched {} contacts from DynamoDB (full scan)", items.size());
            return items;
        } catch (Exception e) {
            logger.error("Failed to scan all contacts", e);
            throw new RuntimeException("Error scanning Contacts: " + e.getMessage());
        }
    }

    public void save(Contact contact) {
        if (contact == null || contact.getContactId() == null || contact.getOperation() == null) {
            logger.error("Invalid Contact: null or missing keys");
            throw new IllegalArgumentException("Contact and its keys are required");
        }

        try {
            contactTable.putItem(contact);
            logger.info("Saved Contact: contactId={}, operation={}", contact.getContactId(), contact.getOperation());
            updateSync(contact.getContactId(), contact.getOperation());
        } catch (Exception e) {
            logger.error("Failed to save Contact: contactId={}, operation={}",
                    contact.getContactId(), contact.getOperation(), e);
            throw new RuntimeException("Error saving Contact: " + e.getMessage());
        }
    }

    public List<Contact> findByContactId(String contactId) {
        if (contactId == null || contactId.trim().isEmpty()) {
            logger.error("Invalid contactId: null or empty");
            throw new IllegalArgumentException("contactId is required");
        }

        try {
            Key key = Key.builder().partitionValue(contactId).build();
            List<Contact> items = contactTable.query(QueryConditional.keyEqualTo(key))
                    .items()
                    .stream()
                    .collect(Collectors.toList());

            logger.info("Found {} contacts for contactId={}", items.size(), contactId);
            return items;
        } catch (Exception e) {
            logger.error("Failed to query contacts for contactId={}", contactId, e);
            throw new RuntimeException("Error querying Contacts: " + e.getMessage());
        }
    }

    public Optional<Contact> findByContactIdAndOperation(String contactId, String operation) {
        if (contactId == null || contactId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: contactId or operation is null/empty");
            throw new IllegalArgumentException("contactId and operation are required");
        }

        try {
            Key key = Key.builder()
                    .partitionValue(contactId)
                    .sortValue(operation)
                    .build();
            Contact item = contactTable.getItem(key);

            if (item != null) {
                logger.info("Found Contact: contactId={}, operation={}", contactId, operation);
                return Optional.of(item);
            } else {
                logger.info("No Contact found for contactId={}, operation={}", contactId, operation);
                return Optional.empty();
            }
        } catch (Exception e) {
            logger.error("Failed to fetch Contact: contactId={}, operation={}", contactId, operation, e);
            throw new RuntimeException("Error fetching Contact: " + e.getMessage());
        }
    }

    public void delete(String contactId, String operation) {
        if (contactId == null || contactId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: contactId or operation is null/empty");
            throw new IllegalArgumentException("contactId and operation are required");
        }

        try {
            Key key = Key.builder()
                    .partitionValue(contactId)
                    .sortValue(operation)
                    .build();
            contactTable.deleteItem(key);
            logger.info("Deleted Contact: contactId={}, operation={}", contactId, operation);
            updateSync(contactId, operation);
        } catch (Exception e) {
            logger.error("Failed to delete Contact: contactId={}, operation={}", contactId, operation, e);
            throw new RuntimeException("Error deleting Contact: " + e.getMessage());
        }
    }

    public void batchSave(List<Contact> items) {
        if (items == null || items.isEmpty()) {
            logger.warn("Empty batch save request");
            return;
        }

        try {
            List<Contact> itemsToWrite = items.stream()
                    .filter(item -> item != null && item.getContactId() != null && item.getOperation() != null)
                    .toList();

            if (itemsToWrite.size() < items.size()) {
                logger.warn("Filtered out {} invalid contacts from batch", items.size() - itemsToWrite.size());
            }

            itemsToWrite.forEach(contactTable::putItem);
            itemsToWrite.forEach(item -> updateSync(item.getContactId(), item.getOperation()));

            logger.info("Successfully batch saved {} contacts", itemsToWrite.size());
        } catch (Exception e) {
            logger.error("Batch save operation failed", e);
            throw new RuntimeException("Batch save failed: " + e.getMessage(), e);
        }
    }

    public void batchDelete(List<Contact> items) {
        if (items == null || items.isEmpty()) {
            logger.warn("Empty batch delete request");
            return;
        }

        try {
            List<Contact> validItems = items.stream()
                    .filter(item -> item != null && item.getContactId() != null && item.getOperation() != null)
                    .toList();

            if (validItems.size() < items.size()) {
                logger.warn("Filtered out {} invalid contacts from batch delete", items.size() - validItems.size());
            }

            validItems.forEach(item -> {
                Key key = Key.builder()
                        .partitionValue(item.getContactId())
                        .sortValue(item.getOperation())
                        .build();
                contactTable.deleteItem(key);
                updateSync(item.getContactId(), item.getOperation());
            });

            logger.info("Successfully batch deleted {} contacts", validItems.size());
        } catch (Exception e) {
            logger.error("Batch delete operation failed", e);
            throw new RuntimeException("Batch delete failed: " + e.getMessage(), e);
        }
    }
}