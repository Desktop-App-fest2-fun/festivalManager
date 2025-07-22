package fun.fest2.contacts;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Endpoint
@AnonymousAllowed
public class ContactEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(ContactEndpoint.class);
    private final ContactService contactService;

    @Autowired
    public ContactEndpoint(ContactService contactService) {
        this.contactService = contactService;
    }

    public List<Map<String, Object>> getAllContacts() {
        try {
            List<Contact> allItems = contactService.findAll();
            if (allItems.isEmpty()) {
                logger.info("No contacts found in DynamoDB");
                return new ArrayList<>();
            }

            // Group by contactId
            Map<String, Map<String, Object>> contactsById = new HashMap<>();
            for (Contact item : allItems) {
                Map<String, Object> contact = contactsById.computeIfAbsent(item.getContactId(), k -> {
                    Map<String, Object> newContact = new HashMap<>();
                    newContact.put("contactId", k);
                    return newContact;
                });

                // Add operation data
                Map<String, Object> operationData = new HashMap<>();
                if (item.getData() != null) {
                    operationData.putAll(item.getData());
                }
                contact.put(item.getOperation(), operationData);
            }

            logger.info("Retrieved {} contacts from DynamoDB", contactsById.size());
            return new ArrayList<>(contactsById.values());
        } catch (Exception e) {
            logger.error("Failed to retrieve all contacts", e);
            throw new RuntimeException("Error retrieving contacts: " + e.getMessage());
        }
    }

    public Contact getContactByIdAndOperation(String contactId, String operation) {
        try {
            Contact item = contactService.findByContactIdAndOperation(contactId, operation);
            if (item != null) {
                logger.info("Retrieved Contact for contactId={}, operation={}", contactId, operation);
                return item;
            } else {
                logger.info("No Contact found for contactId={}, operation={}", contactId, operation);
                return null;
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve Contact for contactId={}, operation={}", contactId, operation, e);
            throw new RuntimeException("Error retrieving Contact: " + e.getMessage());
        }
    }

    public Map<String, Object> getContactById(String contactId) {
        List<Contact> items = contactService.findByContactId(contactId);
        if (items.isEmpty()) {
            logger.info("No data found for contactId={}", contactId);
            return null;
        }

        Map<String, Object> contact = new HashMap<>();
        contact.put("contactId", contactId);

        for (Contact item : items) {
            Map<String, Object> eventData = new HashMap<>();
            if (item.getData() != null) {
                eventData.putAll(item.getData());
            }
            contact.put(item.getContactId(), eventData);
        }

        return contact;
    }

    public Contact saveContact(Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("contactId") || !payload.containsKey("operation")) {
            logger.error("Invalid payload: missing contactId or operation");
            throw new IllegalArgumentException("contactId and operation are required");
        }

        String contactId = (String) payload.get("contactId");
        String operation = (String) payload.get("operation");
        Contact item = new Contact(contactId, operation);

        Object dataObj = payload.get("data");
        if (dataObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) dataObj;
            if (!data.isEmpty()) {
                item.setData(data);
            }
        } else if (dataObj != null) {
            logger.warn("Invalid data field in payload: not a map, ignoring");
        }

        contactService.save(item);

        return item;
    }
}