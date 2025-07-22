package fun.fest2.event.guestCheckIn;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;

import fun.fest2.event.EventItem;
import fun.fest2.event.EventItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.Optional;

@Endpoint
@AnonymousAllowed
public class ZoneAccessControlEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(ZoneAccessControlEndpoint.class);

    @Autowired
    private EventItemRepository repository;

    public AccessResult checkZoneAccess(String eventId, String bandWristId, String targetZoneId) {
        logger.info("Checking zone access for eventId={}, bandWristId={}, targetZoneId={}", eventId, bandWristId, targetZoneId);

        if (eventId == null || bandWristId == null || targetZoneId == null || eventId.trim().isEmpty() || bandWristId.trim().isEmpty() || targetZoneId.trim().isEmpty()) {
            logger.error("Invalid input: eventId={}, bandWristId={}, targetZoneId={}", eventId, bandWristId, targetZoneId);
            return new AccessResult(false, "Invalid parameters", null);
        }

        try {
            Optional<EventItem> zonesValidationOpt = repository.findByEventIdAndOperation(eventId, "zonesValidation");
            if (zonesValidationOpt.isEmpty()) {
                logger.error("zonesValidation EventItem not found for eventId={}", eventId);
                return new AccessResult(false, "Event not found", null);
            }

            EventItem zonesValidationItem = zonesValidationOpt.get();
            Map<String, Object> data = zonesValidationItem.getData();
            if (data == null) {
                logger.error("Data is null in zonesValidation for eventId={}", eventId);
                return new AccessResult(false, "Event data not found", null);
            }

            Map<String, Object> bandWristIds = (Map<String, Object>) data.get("bandWristIds");
            Map<String, Object> zones = (Map<String, Object>) data.get("zones");
            Map<String, Object> metadataZones = (Map<String, Object>) data.get("metadataZones");
            if (bandWristIds == null || zones == null || metadataZones == null) {
                logger.error("bandWristIds, zones, or metadataZones is null for eventId={}", eventId);
                return new AccessResult(false, "Event configuration missing", null);
            }

            Map<String, Object> bandWristData = (Map<String, Object>) bandWristIds.get(bandWristId);
            if (bandWristData == null) {
                logger.error("bandWristId {} not found for eventId={}", bandWristId, eventId);
                return new AccessResult(false, "Invalid BandWrist ID", null);
            }

            String type = (String) bandWristData.get("type");
            int currentZoneId = ((Number) bandWristData.get("zoneId")).intValue();

            Map<String, Object> targetZone = (Map<String, Object>) zones.get(targetZoneId);
            if (targetZone == null) {
                logger.error("Target zone {} not found for eventId={}", targetZoneId, eventId);
                return new AccessResult(false, "Invalid target zone", null);
            }

            String zoneName = (String) targetZone.get("name");
            int targetZoneIdNum = ((Number) targetZone.get("id")).intValue();

            // Validate allowed movements (0 > 1, 1 > 0, 0 > 2, 2 > 0)
            boolean isValidMovement = (currentZoneId == 0 && targetZoneIdNum == 1) ||
                    (currentZoneId == 1 && targetZoneIdNum == 0) ||
                    (currentZoneId == 0 && targetZoneIdNum == 2) ||
                    (currentZoneId == 2 && targetZoneIdNum == 0);
            if (!isValidMovement) {
                logger.info("Invalid movement for bandWristId {}: {} > {} not allowed for eventId={}",
                        bandWristId, currentZoneId, targetZoneIdNum, eventId);
                return new AccessResult(false, "Movement not allowed: Only 0 > 1, 1 > 0, 0 > 2, 2 > 0 permitted", zoneName);
            }

            // Check if already in target zone
            if (currentZoneId == targetZoneIdNum) {
                logger.info("bandWristId {} is already in zone {} for eventId={}", bandWristId, targetZoneId, eventId);
                return new AccessResult(true, "Already in " + zoneName, zoneName);
            }

            // Check access permission
            boolean typeAllowed = (Boolean) targetZone.getOrDefault(type, false);
            if (!typeAllowed) {
                logger.info("Access denied: {} not allowed in {} for bandWristId={}", type, zoneName, bandWristId);
                return new AccessResult(false, "Cannot enter " + zoneName + ": Invalid invitation type", zoneName);
            }

            // Check max capacity
            int maxCapacity = ((Number) targetZone.get("maxCapacity")).intValue();
            int peopleInZone = ((Number) metadataZones.getOrDefault("peopleZone#" + String.format("%02d", targetZoneIdNum) + "Qty", 0)).intValue();
            if (peopleInZone >= maxCapacity) {
                logger.info("Access denied: No capacity in {} for bandWristId={}", zoneName, bandWristId);
                return new AccessResult(false, "Cannot enter " + zoneName + ": Zone at maximum capacity", zoneName);
            }

            // Update zone assignment
            bandWristData.put("zoneId", targetZoneIdNum);
            bandWristIds.put(bandWristId, bandWristData);

            // Update people counts
            Number currentZoneQtyNum = (Number) metadataZones.getOrDefault("peopleZone#" + String.format("%02d", currentZoneId) + "Qty", 0);
            int currentZoneQty = currentZoneQtyNum.intValue();
            metadataZones.put("peopleZone#" + String.format("%02d", currentZoneId) + "Qty", Math.max(0, currentZoneQty - 1));

            Number targetZoneQtyNum = (Number) metadataZones.getOrDefault("peopleZone#" + String.format("%02d", targetZoneIdNum) + "Qty", 0);
            int targetZoneQty = targetZoneQtyNum.intValue();
            metadataZones.put("peopleZone#" + String.format("%02d", targetZoneIdNum) + "Qty", targetZoneQty + 1);

            // Update total peopleQty as sum of zone quantities
            int peopleZone00Qty = ((Number) metadataZones.getOrDefault("peopleZone#00Qty", 0)).intValue();
            int peopleZone01Qty = ((Number) metadataZones.getOrDefault("peopleZone#01Qty", 0)).intValue();
            int peopleZone02Qty = ((Number) metadataZones.getOrDefault("peopleZone#02Qty", 0)).intValue();
            metadataZones.put("peopleQty", peopleZone00Qty + peopleZone01Qty + peopleZone02Qty);

            data.put("bandWristIds", bandWristIds);
            data.put("metadataZones", metadataZones);
            zonesValidationItem.setData(data);
            repository.save(zonesValidationItem);

            logger.info("Access granted: bandWristId={} moved to {}", bandWristId, zoneName);
            return new AccessResult(true, "Access granted to " + zoneName, zoneName);
        } catch (Exception e) {
            logger.error("Error checking zone access for bandWristId={}", bandWristId, e);
            return new AccessResult(false, "Error checking zone access", null);
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

    public static class AccessResult {
        private final boolean success;
        private final String message;
        private final String zoneName;

        public AccessResult(boolean success, String message, String zoneName) {
            this.success = success;
            this.message = message;
            this.zoneName = zoneName;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public String getZoneName() {
            return zoneName;
        }
    }
}