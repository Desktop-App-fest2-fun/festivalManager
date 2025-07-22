package fun.fest2.event.guestCheckIn;

import fun.fest2.event.EventItem;
import fun.fest2.event.EventItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GuestCheckInService {

    private static final Logger logger = LoggerFactory.getLogger(GuestCheckInService.class);
    private final EventItemRepository repository;

    @Autowired
    public GuestCheckInService(EventItemRepository repository) {
        this.repository = repository;
    }

    public GuestInfo validateGuestQr(String eventId, String operation, String qrId) {
        logger.info("Validating QR ID {} for eventId={}, operation={}", qrId, eventId, operation);

        if (eventId == null || operation == null || qrId == null ||
                eventId.trim().isEmpty() || operation.trim().isEmpty() || qrId.trim().isEmpty()) {
            logger.error("Invalid parameters: eventId={}, operation={}, qrId={}", eventId, operation, qrId);
            return null;
        }

        try {
            Optional<EventItem> eventItemOpt = repository.findByEventIdAndOperation(eventId, "qrValidation");
            if (eventItemOpt.isEmpty()) {
                logger.info("No event found for eventId={}, operation={}", eventId, operation);
                return null;
            }

            EventItem eventItem = eventItemOpt.get();
            List<Map<String, Object>> contacts = eventItem.getContacts();
            if (contacts == null || contacts.isEmpty()) {
                logger.info("Contacts list is null or empty for eventId={}, operation={}", eventId, operation);
                return null;
            }

            for (Map<String, Object> contact : contacts) {
                if (contact.containsKey(qrId)) {
                    Map<String, Object> contactDetails = (Map<String, Object>) contact.get(qrId);
                    String name = (String) contactDetails.get("name");
                    String email = (String) contactDetails.get("email");
                    logger.info("QR ID {} found for eventId={}, operation={}, name={}, email={}",
                            qrId, eventId, operation, name, email);
                    return new GuestInfo(name, email);
                }
            }

            logger.info("QR ID {} not found in contacts for eventId={}, operation={}. Checked IDs: {}",
                    qrId, eventId, operation, contacts.stream().flatMap(m -> m.keySet().stream()).toList());
            return null;
        } catch (Exception e) {
            logger.error("Error validating QR ID {} for eventId={}, operation={}", qrId, eventId, operation, e);
            return null;
        }
    }

    public boolean assignBandWristId(String eventId, String operation, String qrId, String bandWristId) {
        logger.info("Assigning bandWristId {} to QR ID {} for eventId={}, operation={}",
                bandWristId, qrId, eventId, operation);

        if (eventId == null || operation == null || qrId == null || bandWristId == null ||
                eventId.trim().isEmpty() || operation.trim().isEmpty() ||
                qrId.trim().isEmpty() || bandWristId.trim().isEmpty()) {
            logger.error("Invalid parameters: eventId={}, operation={}, qrId={}, bandWristId={}",
                    eventId, operation, qrId, bandWristId);
            return false;
        }

        try {
            Optional<EventItem> eventItemOpt = repository.findByEventIdAndOperation(eventId, "qrValidation");
            if (eventItemOpt.isEmpty()) {
                logger.info("No event found for eventId={}, operation={}", eventId, operation);
                return false;
            }

            EventItem eventItem = eventItemOpt.get();
            List<Map<String, Object>> contacts = eventItem.getContacts();
            if (contacts == null || contacts.isEmpty()) {
                logger.info("Contacts list is null or empty for eventId={}, operation={}", eventId, operation);
                return false;
            }

            boolean updated = false;
            Map<String, Object> contactDetails = null;
            for (Map<String, Object> contact : contacts) {
                if (contact.containsKey(qrId)) {
                    contactDetails = (Map<String, Object>) contact.get(qrId);
                    contactDetails.put("bandWristId", bandWristId);
                    updated = true;
                    logger.info("Assigned bandWristId {} to QR ID {} for eventId={}, operation={}",
                            bandWristId, qrId, eventId, operation);
                    break;
                }
            }

            if (!updated) {
                logger.info("QR ID {} not found in contacts for eventId={}, operation={}",
                        qrId, eventId, operation);
                return false;
            }

            // Save qrValidation update
            repository.save(eventItem);
            logger.info("EventItem updated with new bandWristId for QR ID {}, eventId={}, operation={}",
                    qrId, eventId, operation);

            // Update zonesValidation
            boolean zonesUpdated = updateZonesValidation(eventId, bandWristId, contactDetails);
            if (!zonesUpdated) {
                logger.error("Failed to update zonesValidation for bandWristId {}, eventId={}", bandWristId, eventId);
                return false; // Roll back if zonesValidation update fails
            }

            return true;
        } catch (Exception e) {
            logger.error("Error assigning bandWristId {} to QR ID {} for eventId={}, operation={}",
                    bandWristId, qrId, eventId, operation, e);
            return false;
        }
    }

    private boolean updateZonesValidation(String eventId, String bandWristId, Map<String, Object> contactDetails) {
        logger.info("Updating zonesValidation with bandWristId {} for eventId={}", bandWristId, eventId);

        // Validate contactDetails
        if (!contactDetails.containsKey("invitation") || !contactDetails.containsKey("name") || !contactDetails.containsKey("type")) {
            logger.error("Missing required fields in contactDetails for bandWristId {}: invitation={}, name={}, type={}",
                    bandWristId, contactDetails.get("invitation"), contactDetails.get("name"), contactDetails.get("type"));
            return false;
        }

        try {
            Optional<EventItem> zonesValidationOpt = repository.findByEventIdAndOperation(eventId, "zonesValidation");
            if (zonesValidationOpt.isEmpty()) {
                logger.error("zonesValidation EventItem not found for eventId={}", eventId);
                return false;
            }

            EventItem zonesValidationItem = zonesValidationOpt.get();
            Map<String, Object> data = zonesValidationItem.getData();
            if (data == null) {
                logger.error("Data is null in zonesValidation for eventId={}", eventId);
                return false;
            }

            // Get or initialize bandWristIds
            Map<String, Object> bandWristIds = (Map<String, Object>) data.computeIfAbsent("bandWristIds", k -> new HashMap<>());

            // Create bandWristId entry
            Map<String, Object> bandWristEntry = new HashMap<>();
            bandWristEntry.put("invitation", contactDetails.get("invitation"));
            bandWristEntry.put("name", contactDetails.get("name"));
            bandWristEntry.put("type", contactDetails.get("type"));
            bandWristEntry.put("zoneId", 0); // Default to zone 0
            bandWristIds.put(bandWristId, bandWristEntry);
            logger.info("Added bandWristId {} to bandWristIds: {}", bandWristId, bandWristEntry);

            // Update peopleQty in metadataZones
            Map<String, Object> metadataZones = (Map<String, Object>) data.get("metadataZones");
            if (metadataZones == null) {
                logger.error("metadataZones is null in zonesValidation for eventId={}", eventId);
                return false;
            }
            Number peopleQtyNum = (Number) metadataZones.getOrDefault("peopleQty", 0);
            int peopleQty = peopleQtyNum.intValue();
            metadataZones.put("peopleQty", peopleQty + 1);
            metadataZones.put("peopleZone#00Qty", peopleQty + 1);
            logger.info("Updated peopleQty to {} for eventId={}", peopleQty + 1, eventId);

            // Save zonesValidation update
            repository.save(zonesValidationItem);
            logger.info("Successfully updated zonesValidation with bandWristId {} for eventId={}", bandWristId, eventId);
            return true;
        } catch (Exception e) {
            logger.error("Error updating zonesValidation for bandWristId {}, eventId={}", bandWristId, eventId, e);
            return false;
        }
    }

    public Integer getBandWristZone(String eventId, String bandWristId) {
        logger.info("Fetching zone for eventId={}, bandWristId={}", eventId, bandWristId);

        if (eventId == null || bandWristId == null || eventId.trim().isEmpty() || bandWristId.trim().isEmpty()) {
            logger.error("Invalid input: eventId={}, bandWristId={}", eventId, bandWristId);
            return null;
        }

        try {
            Optional<EventItem> zonesValidationOpt = repository.findByEventIdAndOperation(eventId, "zonesValidation");
            if (zonesValidationOpt.isEmpty()) {
                logger.error("zonesValidation EventItem not found for eventId={}", eventId);
                return null;
            }

            EventItem zonesValidationItem = zonesValidationOpt.get();
            Map<String, Object> data = zonesValidationItem.getData();
            if (data == null) {
                logger.error("Data is null in zonesValidation for eventId={}", eventId);
                return null;
            }

            Map<String, Object> bandWristIds = (Map<String, Object>) data.get("bandWristIds");
            if (bandWristIds == null) {
                logger.error("bandWristIds is null for eventId={}", eventId);
                return null;
            }

            Map<String, Object> bandWristData = (Map<String, Object>) bandWristIds.get(bandWristId);
            if (bandWristData == null) {
                logger.error("bandWristId {} not found for eventId={}", bandWristId, eventId);
                return null;
            }

            int zoneId = ((Number) bandWristData.get("zoneId")).intValue();
            logger.info("bandWristId={} is in zoneId={}", bandWristId, zoneId);
            return zoneId;
        } catch (Exception e) {
            logger.error("Error fetching zone for bandWristId={}", bandWristId, e);
            return null;
        }
    }

    public static class GuestInfo {
        private final String name;
        private final String email;

        public GuestInfo(String name, String email) {
            this.name = name;
            this.email = email;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }
    }
}