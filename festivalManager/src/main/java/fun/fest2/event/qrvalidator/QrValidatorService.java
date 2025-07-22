package fun.fest2.event.qrvalidator;


import fun.fest2.event.EventItem;
import fun.fest2.event.EventItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class QrValidatorService {

    private static final Logger logger = LoggerFactory.getLogger(QrValidatorService.class);
    private final EventItemRepository repository;

    @Autowired
    public QrValidatorService(EventItemRepository repository) {
        this.repository = repository;
    }

    public boolean validateQr(String eventId, String operation, String qrId) {
        logger.info("Validating QR ID {} for eventId={}, operation={}", qrId, eventId, operation);

        // Validate input parameters
        if (eventId == null || operation == null || qrId == null ||
                eventId.trim().isEmpty() || operation.trim().isEmpty() || qrId.trim().isEmpty()) {
            logger.error("Invalid parameters: eventId={}, operation={}, qrId={}", eventId, operation, qrId);
            return false;
        }

        try {
            // Retrieve EventItem from repository
            Optional<EventItem> eventItemOpt = repository.findByEventIdAndOperation(eventId, operation);
            if (eventItemOpt.isEmpty()) {
                logger.info("No event found for eventId={}, operation={}", eventId, operation);
                return false;
            }

            EventItem eventItem = eventItemOpt.get();
            List<Map<String, Object>> contacts = eventItem.getContacts();

            // Check if contacts list is null or empty
            if (contacts == null || contacts.isEmpty()) {
                logger.info("Contacts list is null or empty for eventId={}, operation={}", eventId, operation);
                return false;
            }

            // Iterate through contacts to find the QR ID
            for (Map<String, Object> contact : contacts) {
                if (contact.containsKey(qrId)) {
                    logger.info("QR ID {} found in contacts for eventId={}, operation={}", qrId, eventId, operation);
                    return true;
                }
            }

            // Log all checked IDs for debugging
            logger.info("QR ID {} not found in contacts for eventId={}, operation={}. Checked IDs: {}",
                    qrId, eventId, operation, contacts.stream().flatMap(m -> m.keySet().stream()).toList());
            return false;
        } catch (Exception e) {
            logger.error("Error validating QR ID {} for eventId={}, operation={}", qrId, eventId, operation, e);
            return false;
        }
    }
}