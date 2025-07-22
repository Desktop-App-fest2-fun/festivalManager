package fun.fest2.contacts;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ContactService {

    private static final int MAX_BATCH_SIZE = 25;
    private static final Logger logger = LoggerFactory.getLogger(ContactService.class);
    private final ContactRepository repository;

    @Autowired
    public ContactService(ContactRepository repository) {
        this.repository = repository;
    }

    public List<Contact> findAll() {
        try {
            List<Contact> items = repository.findAll();
            logger.info("Fetched {} contacts from DynamoDB", items.size());
            return items;
        } catch (Exception e) {
            logger.error("Error fetching all contacts", e);
            throw new RuntimeException("Failed to fetch all contacts: " + e.getMessage());
        }
    }

    public List<Contact> findByContactId(String contactId) {
        if (contactId == null || contactId.trim().isEmpty()) {
            logger.error("Invalid contactId: null or empty");
            throw new IllegalArgumentException("contactId is required");
        }

        try {
            List<Contact> items = repository.findByContactId(contactId);
            logger.info("Fetched {} contacts for contactId={}", items.size(), contactId);
            return items;
        } catch (Exception e) {
            logger.error("Error fetching contacts for contactId={}", contactId, e);
            throw new RuntimeException("Failed to fetch contacts: " + e.getMessage());
        }
    }

    public Contact findByContactIdAndOperation(String contactId, String operation) {
        if (contactId == null || contactId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: contactId or operation is null/empty");
            throw new IllegalArgumentException("contactId and operation are required");
        }

        try {
            Optional<Contact> item = repository.findByContactIdAndOperation(contactId, operation);
            if (item.isPresent()) {
                logger.info("Found contact for contactId={}, operation={}", contactId, operation);
                return item.get();
            } else {
                logger.info("No contact found for contactId={}, operation={}", contactId, operation);
                return null;
            }
        } catch (Exception e) {
            logger.error("Error fetching contact for contactId={}, operation={}", contactId, operation, e);
            throw new RuntimeException("Failed to fetch contact: " + e.getMessage());
        }
    }

    public void save(Contact contact) {
        repository.save(contact);
    }

    public void delete(String contactId, String operation) {
        if (contactId == null || contactId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: contactId or operation is null/empty");
            throw new IllegalArgumentException("contactId and operation are required");
        }

        try {
            repository.delete(contactId, operation);
            logger.info("Deleted contact: contactId={}, operation={}", contactId, operation);
        } catch (Exception e) {
            logger.error("Error deleting contact: contactId={}, operation={}", contactId, operation, e);
            throw new RuntimeException("Failed to delete contact: " + e.getMessage());
        }
    }

    public int deleteByContactId(String contactId) {
        if (contactId == null || contactId.trim().isEmpty()) {
            logger.error("Invalid contactId: null or empty");
            throw new IllegalArgumentException("contactId is required");
        }

        try {
            List<Contact> contacts = repository.findByContactId(contactId);
            if (contacts.isEmpty()) {
                logger.info("No contacts found for contactId: {}", contactId);
                return 0;
            }

            List<List<Contact>> chunks = partitionList(contacts);
            chunks.forEach(repository::batchDelete);
            logger.info("Deleted {} contacts for contactId: {}", contacts.size(), contactId);
            return contacts.size();
        } catch (Exception e) {
            logger.error("Failed to delete contacts for contactId: {}", contactId, e);
            throw new RuntimeException("Delete operation failed: " + e.getMessage());
        }
    }

    public List<Contact> batchSave(List<Contact> items) {
        try {
            List<List<Contact>> chunks = partitionList(items);
            chunks.forEach(repository::batchSave);
            logger.info("Successfully saved {} contacts in batches", items.size());
        } catch (Exception e) {
            logger.error("Batch save failed", e);
            throw new RuntimeException("Batch operation failed: " + e.getMessage());
        }
        return items;
    }

    private <T> List<List<T>> partitionList(List<T> list) {
        int numChunks = (int) Math.ceil((double) list.size() / MAX_BATCH_SIZE);
        List<List<T>> chunks = new ArrayList<>(numChunks);
        for (int i = 0; i < numChunks; i++) {
            int start = i * MAX_BATCH_SIZE;
            int end = Math.min((i + 1) * MAX_BATCH_SIZE, list.size());
            chunks.add(list.subList(start, end));
        }
        return chunks;
    }
}