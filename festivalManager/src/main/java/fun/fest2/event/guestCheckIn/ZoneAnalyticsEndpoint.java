package fun.fest2.event.guestCheckIn;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;

import fun.fest2.event.EventItem;
import fun.fest2.event.EventItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Endpoint
@AnonymousAllowed
public class ZoneAnalyticsEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(ZoneAnalyticsEndpoint.class);

    @Autowired
    private EventItemRepository repository;

    public AnalyticsData getAnalyticsData(String eventId) {
        logger.info("Fetching analytics data for eventId={}", eventId);

        if (eventId == null || eventId.trim().isEmpty()) {
            logger.error("Invalid eventId: {}", eventId);
            return new AnalyticsData(0, 0, new ArrayList<>());
        }

        try {
            Optional<EventItem> zonesValidationOpt = repository.findByEventIdAndOperation(eventId, "zonesValidation");
            if (zonesValidationOpt.isEmpty()) {
                logger.error("zonesValidation EventItem not found for eventId={}", eventId);
                return new AnalyticsData(0, 0, new ArrayList<>());
            }

            EventItem zonesValidationItem = zonesValidationOpt.get();
            Map<String, Object> data = zonesValidationItem.getData();
            if (data == null) {
                logger.error("Data is null in zonesValidation for eventId={}", eventId);
                return new AnalyticsData(0, 0, new ArrayList<>());
            }

            Map<String, Object> metadataZones = (Map<String, Object>) data.get("metadataZones");
            Map<String, Object> zones = (Map<String, Object>) data.get("zones");
            if (metadataZones == null || zones == null) {
                logger.error("metadataZones or zones is null for eventId={}", eventId);
                return new AnalyticsData(0, 0, new ArrayList<>());
            }

            int peopleQty = ((Number) metadataZones.getOrDefault("peopleQty", 0)).intValue();
            List<ZoneData> zoneDataList = new ArrayList<>();
            int totalAvailableSpots = 0;

            for (Map.Entry<String, Object> zoneEntry : zones.entrySet()) {
                String zoneId = zoneEntry.getKey();
                Map<String, Object> zone = (Map<String, Object>) zoneEntry.getValue();
                String zoneName = (String) zone.get("name");
                int zoneIdNum = ((Number) zone.get("id")).intValue();
                int maxCapacity = ((Number) zone.get("maxCapacity")).intValue();
                int peopleInZone = ((Number) metadataZones.getOrDefault("peopleZone#" + String.format("%02d", zoneIdNum) + "Qty", 0)).intValue();
                int availableSpots = Math.max(0, maxCapacity - peopleInZone);

                logger.info("Zone {}: zoneId={}, peopleInZone={}, availableSpots={}", zoneName, zoneIdNum, peopleInZone, availableSpots);
                totalAvailableSpots += availableSpots;
                zoneDataList.add(new ZoneData(zoneName, zoneIdNum, peopleInZone, availableSpots));
            }

            return new AnalyticsData(peopleQty, totalAvailableSpots, zoneDataList);
        } catch (Exception e) {
            logger.error("Error fetching analytics data for eventId={}", eventId, e);
            return new AnalyticsData(0, 0, new ArrayList<>());
        }
    }

    public static class AnalyticsData {
        private final int totalPeople;
        private final int totalAvailableSpots;
        private final List<ZoneData> zones;

        public AnalyticsData(int totalPeople, int totalAvailableSpots, List<ZoneData> zones) {
            this.totalPeople = totalPeople;
            this.totalAvailableSpots = totalAvailableSpots;
            this.zones = zones;
        }

        public int getTotalPeople() {
            return totalPeople;
        }

        public int getTotalAvailableSpots() {
            return totalAvailableSpots;
        }

        public List<ZoneData> getZones() {
            return zones;
        }
    }

    public static class ZoneData {
        private final String zoneName;
        private final int zoneId;
        private final int peopleInZone;
        private final int availableSpots;

        public ZoneData(String zoneName, int zoneId, int peopleInZone, int availableSpots) {
            this.zoneName = zoneName;
            this.zoneId = zoneId;
            this.peopleInZone = peopleInZone;
            this.availableSpots = availableSpots;
        }

        public String getZoneName() {
            return zoneName;
        }

        public int getZoneId() {
            return zoneId;
        }

        public int getPeopleInZone() {
            return peopleInZone;
        }

        public int getAvailableSpots() {
            return availableSpots;
        }
    }
}