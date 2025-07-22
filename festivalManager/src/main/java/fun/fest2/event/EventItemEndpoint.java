package fun.fest2.event;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import fun.fest2.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Endpoint
@AnonymousAllowed
public class EventItemEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(EventItemEndpoint.class);
    private final EventService eventService;

    @Autowired
    private UserService userService;

    @Autowired
    public EventItemEndpoint(EventService eventService) {
        this.eventService = eventService;
    }

    public EventItem saveEventItem(Map<String, Object> payload) {
        logger.info("Received saveEventItem payload: {}", payload);

        String eventId = (String) payload.get("eventId");
        String operation = (String) payload.get("operation");

        if (eventId == null || operation == null) {
            logger.error("Invalid payload: eventId or operation is null, payload: {}", payload);
            throw new IllegalArgumentException("eventId and operation are required");
        }

        EventItem item = new EventItem(eventId, operation);
        Object dataObj = payload.get("data");
        if (dataObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) dataObj;
            item.setData(data);
        } else {
            logger.warn("Payload 'data' is not a map, setting empty data: {}", dataObj);
            item.setData(Map.of());
        }

        try {
            logger.debug("Attempting to save EventItem: {}", item);
            eventService.save(item);
            logger.info("Saved EventItem: eventId={}, operation={}", eventId, operation);
            return item;
        } catch (Exception e) {
            logger.error("Failed to save EventItem: eventId={}, operation={}, error: {}", eventId, operation, e.getMessage(), e);
            throw new RuntimeException("Error saving EventItem: " + e.getMessage());
        }
    }

    public EventItem createEventItem(Map<String, Object> payload) {
        logger.info("Received createEventItem payload: {}", payload);

        // Validate and extract operation
        String operation = (String) payload.get("operation");
        if (!"core".equals(operation)) {
            logger.error("Invalid operation: {}", operation);
            throw new IllegalArgumentException("Operation must be 'core' for event creation");
        }

        // Validate and extract data
        Object dataObj = payload.get("data");
        if (!(dataObj instanceof Map)) {
            logger.error("Payload 'data' is not a map: {}", dataObj);
            throw new IllegalArgumentException("Payload 'data' must be a map");
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) dataObj;

        // Extract coreData for eventId generation
        Object coreDataObj = data.get("coreData");
        if (!(coreDataObj instanceof Map)) {
            logger.error("Payload 'data.coreData' is not a map: {}", coreDataObj);
            throw new IllegalArgumentException("Payload 'data.coreData' must be a map");
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> coreData = (Map<String, Object>) coreDataObj;
        
        // Validate and extract generalData
        Object generalDataObj = coreData.get("generalData");
        if (generalDataObj == null || !(generalDataObj instanceof Map)) {
            logger.error("Payload 'data.coreData.generalData' is not a map or is null: {}", generalDataObj);
            throw new IllegalArgumentException("Payload 'data.coreData.generalData' must be a map");
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> generalData = (Map<String, Object>) generalDataObj;

        // Generate eventId with short hash
        String eventCode = generalData.get("eventName") != null ?
                ((String) generalData.get("eventName")).toLowerCase().replace(" ", "") : "unknown";
        String yearEdition = generalData.get("yearEdition") != null ?
                String.valueOf(generalData.get("yearEdition")) : "2025";

        // Generate 4-character hash from eventCode
        int nameHash = eventCode.hashCode();
        String shortHash = String.format("%04x", nameHash & 0xffff); // 4 hex chars

        // Build final eventId
        String eventId = String.format("EVENT#%s_%s#%s",
                yearEdition.substring(yearEdition.length() - 2),
                shortHash,
                eventCode);


        // Extract optional fields (contacts, templates, artists, eventDates)
        List<Map<String, Object>> contacts = (List<Map<String, Object>>) payload.getOrDefault("contacts", null);
        List<Map<String, Object>> templates = (List<Map<String, Object>>) payload.getOrDefault("templates", null);
        List<Map<String, Object>> artists = (List<Map<String, Object>>) payload.getOrDefault("artists", null);
        List<Map<String, Object>> eventDates = (List<Map<String, Object>>) payload.getOrDefault("eventDates", null);

        // Create EventItem object and populate attributes
        EventItem item = new EventItem(eventId, operation);
        item.setData(data);  // Store only the inner 'data' field
        item.setContacts(contacts);  // Optional field
        item.setTemplates(templates);  // Optional field
        item.setArtists(artists);  // Optional field
        item.setEventDates(eventDates);  // Optional field

        // Save EventItem to DynamoDB
        try {
            eventService.save(item);
            logger.info("Created EventItem: eventId={}, operation={}", eventId, operation);
            return item;  // Return the created item
        } catch (Exception e) {
            logger.error("Failed to create EventItem: eventId={}, operation={}", eventId, operation, e);
            throw new RuntimeException("Error creating EventItem: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getAllEventItems() {
        try {
            List<EventItem> allItems = eventService.findAll();
            if (allItems.isEmpty()) {
                logger.info("No events found in DynamoDB");
                return new ArrayList<>();
            }

            // Group by eventId
            Map<String, Map<String, Object>> eventsById = new HashMap<>();
            for (EventItem item : allItems) {
                Map<String, Object> event = eventsById.computeIfAbsent(item.getEventId(), k -> {
                    Map<String, Object> newEvent = new HashMap<>();
                    newEvent.put("eventId", k);
                    return newEvent;
                });

                // Add operation data
                Map<String, Object> operationData = new HashMap<>();
                if (item.getData() != null) {
                    operationData.putAll(item.getData());
                }
                event.put(item.getOperation(), operationData);
            }

            logger.info("Retrieved {} events from DynamoDB", eventsById.size());
            return new ArrayList<>(eventsById.values());
        } catch (Exception e) {
            logger.error("Failed to retrieve all events", e);
            throw new RuntimeException("Error retrieving events: " + e.getMessage());
        }
    }

    public EventItem getEventItemByIdAndOperation(String eventId, String operation) {
        try {
            EventItem item = eventService.findByEventIdAndOperation(eventId, operation);
            if (item != null) {
                logger.info("Retrieved EventItem for eventId={}, operation={}", eventId, operation);
                return item;
            } else {
                logger.info("No EventItem found for eventId={}, operation={}", eventId, operation);
                return null;
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve EventItem for eventId={}, operation={}", eventId, operation, e);
            throw new RuntimeException("Error retrieving EventItem: " + e.getMessage());
        }
    }

    public Map<String, Object> getEventItemById(String eventId) {
        List<EventItem> items = eventService.findByEventId(eventId);
        if (items.isEmpty()) {
            logger.info("No data found for eventId={}", eventId);
            return null;
        }

        Map<String, Object> event = new HashMap<>();
        event.put("eventId", eventId);

        for (EventItem item : items) {
            Map<String, Object> operationData = new HashMap<>();

            // Add data if exists
            if (item.getData() != null) {
                operationData.putAll(item.getData());
            }

            // Add contactsList if exists
            if (item.getContacts() != null) {
                operationData.put("contacts", item.getContacts());
            }

            // Add templatesList if exists
            if (item.getTemplates() != null) {
                operationData.put("templates", item.getTemplates());
            }

            // Add artistsList if exists
            if (item.getArtists() != null) {
                operationData.put("artists", item.getArtists());
            }


            // Add eventDates if exists
            if (item.getEventDates() != null) {
                operationData.put("eventDates", item.getEventDates());
            }

            event.put(item.getOperation(), operationData);
        }

        return event;
    }

    public List<EventItem> getEventItemListById(String eventId) {
        List<EventItem> items = eventService.findByEventId(eventId);
        if (items.isEmpty()) {
            logger.info("No data found for eventId={}", eventId);
            return null;
        }
        return items;
    }

    public EventItem saveBundleItem(Map<String, Object> payload) {
        logger.info("Received saveBundleItem payload: {}", payload);

        String eventId = (String) payload.get("eventId");
        String operation = (String) payload.get("operation");

        if (eventId == null || operation == null) {
            logger.error("Invalid payload: eventId or operation is null, payload: {}", payload);
            throw new IllegalArgumentException("eventId and operation are required");
        }

        if (!operation.startsWith("bundle#")) {
            logger.error("Invalid operation: {}", operation);
            throw new IllegalArgumentException("Operation must be 'bundle' for saving bundle items");
        }

        EventItem bundleItem = new EventItem(eventId, operation);
        Object dataObj = payload.get("data");
        if (dataObj instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) dataObj;
            bundleItem.setData(data);
        } else {
            logger.warn("Payload 'data' is not a map, setting empty data: {}", dataObj);
            bundleItem.setData(Map.of());
        }

        Object contactsObj = payload.get("contacts");
        if (contactsObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> contacts = (List<Map<String, Object>>) contactsObj;
            bundleItem.setContacts(contacts);
        } else {
            logger.warn("Payload 'contacts' is not a list, setting empty contacts: {}", contactsObj);
            bundleItem.setContacts(new ArrayList<>());
        }

        Object invitationsObj = payload.get("invitations");
        if (invitationsObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, String>> invitations = (List<Map<String, String>>) invitationsObj;
            bundleItem.setInvitations(invitations);
        } else {
            logger.warn("Payload 'invitations' is not a list, setting empty invitations: {}", invitationsObj);
            bundleItem.setInvitations(new ArrayList<>());
        }

        try {
            logger.debug("Attempting to save BundleItem: {}", bundleItem);
            eventService.save(bundleItem);
            logger.info("Saved BundleItem: eventId={}, operation={}", eventId, operation);
            return bundleItem;
        } catch (Exception e) {
            logger.error("Failed to save BundleItem: eventId={}, operation={}, error: {}", eventId, operation, e.getMessage(), e);
            throw new RuntimeException("Error saving BundleItem: " + e.getMessage());
        }
    }
}