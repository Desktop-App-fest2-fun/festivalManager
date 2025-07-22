package fun.fest2.event.invitations;

import fun.fest2.event.EventItem;
import fun.fest2.event.EventItemRepository;
import fun.fest2.event.invitations.s3Service.S3Service;
import fun.fest2.templates.Template;
import fun.fest2.templates.TemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UpdateInvitationService {

    private static final Logger logger = LoggerFactory.getLogger(UpdateInvitationService.class);

    private final EventItemRepository eventItemRepository;
    private final S3Service s3Service;
    private final TemplateRepository templateRepository;
    private final SpringTemplateEngine templateEngine;

    public UpdateInvitationService(EventItemRepository eventItemRepository, S3Service s3Service,
                                   TemplateRepository templateRepository, SpringTemplateEngine templateEngine) {
        this.eventItemRepository = eventItemRepository;
        this.s3Service = s3Service;
        this.templateRepository = templateRepository;
        this.templateEngine = templateEngine;
    }

    public void updateInvitation(String eventId, List<String> invitationIds, String templateId, Map<String, Object> invitationData, String updateOperation) {
        long startTime = System.nanoTime();
        logger.info("Updating invitations: eventId={}, invitationCount={}, operation={}", eventId, invitationIds.size(), updateOperation);

        try {
            // Track counts for bundle updates
            Map<String, Long> revokedTypeCounts = new HashMap<>();
            Map<String, Long> approvedTypeCounts = new HashMap<>();
            String bundleId = null;

            for (String invitationId : invitationIds) {
                EventItem invitationItem = eventItemRepository.findByEventIdAndOperation(eventId, invitationId)
                        .orElseThrow(() -> new RuntimeException("Invitation not found: " + invitationId));
                Map<String, Object> currentData = invitationItem.getData();

                // Get bundle ID (assume all invitations are from the same bundle)
                if (bundleId == null) {
                    bundleId = (String) ((Map<String, Object>) currentData.getOrDefault("invitationData", new HashMap<>())).getOrDefault("bundle", "");
                    if (bundleId.isEmpty()) {
                        throw new RuntimeException("Bundle ID not found for invitation: " + invitationId);
                    }
                }

                // Get invitation type
                String invitationType = (String) ((Map<String, Object>) currentData.getOrDefault("invitationData", new HashMap<>())).getOrDefault("invitationType", "");
                if (invitationType.isEmpty()) {
                    throw new RuntimeException("Invitation type not found for invitation: " + invitationId);
                }

                switch (updateOperation) {
                    case "APPROVED":
                        approveInvitation(invitationItem);
                        approvedTypeCounts.merge(invitationType, 1l, Long::sum);
                        break;
                    case "REVOKED":
                        revokeInvitation(invitationItem);
                        revokedTypeCounts.merge(invitationType, 1l, Long::sum);
                        break;
                    case "UPDATE":
                        updateInvitationData(invitationItem, templateId, invitationData);
                        break;
                    default:
                        throw new IllegalArgumentException("Invalid update operation: " + updateOperation);
                }
            }

            // Update bundles if there are APPROVED or REVOKED changes
            if (!approvedTypeCounts.isEmpty() || !revokedTypeCounts.isEmpty()) {
                updateBundles(eventId, bundleId, approvedTypeCounts, revokedTypeCounts);
            }

            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            logger.info("Invitations updated: eventId={}, invitationCount={}, operation={}, duration={} ms",
                    eventId, invitationIds.size(), updateOperation, durationMs);

        } catch (Exception e) {
            logger.error("Failed to update invitations: eventId={}, invitationCount={}, operation={}, error={}",
                    eventId, invitationIds.size(), updateOperation, e.getMessage());
            throw new RuntimeException("Error updating invitations: " + e.getMessage());
        }
    }

    private void approveInvitation(EventItem invitationItem) {
        Map<String, Object> currentData = invitationItem.getData();
        Map<String, Object> invitationStatus = (Map<String, Object>) currentData.getOrDefault("invitationStatus", new HashMap<>());

        String timestamp = Instant.now().toString();
        invitationStatus.put("APPROVED", Map.of(
                "approvedBy", "admin",
                "approvedSource", "FORM-ADMIN",
                "approvedTimestamp", timestamp,
                "approvedCreated", true
        ));
        invitationStatus.put("currentStatus", "APPROVED");
        invitationStatus.put("lastModificationTimestamp", timestamp);

        currentData.put("invitationStatus", invitationStatus);
        invitationItem.setData(currentData);
        eventItemRepository.save(invitationItem);
    }

    private void revokeInvitation(EventItem invitationItem) {
        Map<String, Object> currentData = invitationItem.getData();
        Map<String, Object> invitationStatus = (Map<String, Object>) currentData.getOrDefault("invitationStatus", new HashMap<>());

        String timestamp = Instant.now().toString();
        invitationStatus.put("REVOKED", Map.of(
                "revokedBy", "admin",
                "revokedSource", "FORM-ADMIN",
                "revokedTimestamp", timestamp,
                "revokedCreated", true
        ));
        invitationStatus.put("currentStatus", "REVOKED");
        invitationStatus.put("lastModificationTimestamp", timestamp);

        currentData.put("invitationStatus", invitationStatus);
        invitationItem.setData(currentData);
        eventItemRepository.save(invitationItem);
    }

    private void updateInvitationData(EventItem invitationItem, String templateId, Map<String, Object> invitationData) {
        long startTime = System.nanoTime();
        logger.info("Updating invitation data: eventId={}, invitationId={}, templateId={}",
                invitationItem.getEventId(), invitationItem.getOperation(), templateId);

        try {
            Map<String, Object> data = invitationItem.getData() != null ? invitationItem.getData() : new HashMap<>();

            // Step 1: Update invitationContact
            Map<String, Object> invitationContact = (Map<String, Object>) data.getOrDefault("invitationContact", new HashMap<>());
            invitationContact.put("name", invitationData.getOrDefault("name", invitationContact.getOrDefault("name", "")));
            invitationContact.put("email", invitationData.getOrDefault("email", invitationContact.getOrDefault("email", "")));
            invitationContact.put("invitationType", invitationData.getOrDefault("invitationType", invitationContact.getOrDefault("invitationType", "")));
            data.put("invitationContact", invitationContact);
            logger.info("Step 1: Updated invitationContact: eventId={}, invitationId={}", invitationItem.getEventId(), invitationItem.getOperation());

            // Step 2: Update invitationData
            Map<String, Object> existingInvitationData = (Map<String, Object>) data.getOrDefault("invitationData", new HashMap<>());
            existingInvitationData.put("invitationType", invitationData.getOrDefault("invitationType", existingInvitationData.getOrDefault("invitationType", "")));
            existingInvitationData.put("uploadTimestamp", Instant.now().toString());
            data.put("invitationData", existingInvitationData);
            logger.info("Step 2: Updated invitationData: eventId={}, invitationId={}", invitationItem.getEventId(), invitationItem.getOperation());

            // Step 3: Fetch event details
            Map<String, Object> eventDetails = fetchEventDetails(invitationItem.getEventId());
            logger.info("Step 3: Fetched event details: eventId={}, invitationId={}", invitationItem.getEventId(), invitationItem.getOperation());

            // Step 4: Fetch template
            long templateStart = System.nanoTime();
            Template template = templateRepository.findByTemplateIdAndOperation(templateId, "template")
                    .orElseThrow(() -> new RuntimeException("Template not found: " + templateId));
            double templateDurationMs = (System.nanoTime() - templateStart) / 1_000_000.0;
            logger.info("Step 4: Template fetched: eventId={}, invitationId={}, templateId={}, duration={} ms",
                    invitationItem.getEventId(), invitationItem.getOperation(), templateId, templateDurationMs);

            // Step 5: Use existing template data
            Map<String, Object> invitationTemplate = (Map<String, Object>) data.getOrDefault("invitationTemplate", new HashMap<>());
            invitationTemplate.put("templateId", templateId);
            data.put("invitationTemplate", invitationTemplate);

            // Step 6: Get existing QR URL
            Map<String, Object> invitationQrData = (Map<String, Object>) data.getOrDefault("invitationQrData", new HashMap<>());
            String qrUrl = (String) invitationQrData.getOrDefault("qrImageUrlS3", "");
            logger.info("Step 6: Retrieved QR URL: eventId={}, invitationId={}, qrUrl={}", invitationItem.getEventId(), invitationItem.getOperation(), qrUrl);

            // Step 7: Render HTML
            long renderStart = System.nanoTime();
            Context context = createEmailContext(data, eventDetails, invitationTemplate);
            String htmlContent = templateEngine.process(template.getData().get("content").toString(), context);
            double renderDurationMs = (System.nanoTime() - renderStart) / 1_000_000.0;
            logger.info("Step 7: HTML rendered: eventId={}, invitationId={}, duration={} ms",
                    invitationItem.getEventId(), invitationItem.getOperation(), renderDurationMs);

            // Step 8: Upload HTML to S3
            long s3HtmlStart = System.nanoTime();
            String htmlUrl = s3Service.uploadEmailHtml(htmlContent, invitationItem.getEventId(), invitationItem.getOperation());
            String htmlURI = String.format("s3://fest2fun-invites/fest2fun/%s/emailHTML/%s.html",
                    invitationItem.getEventId(), invitationItem.getOperation());
            double s3HtmlDurationMs = (System.nanoTime() - s3HtmlStart) / 1_000_000.0;
            logger.info("Step 8: S3 HTML uploaded: eventId={}, invitationId={}, url={}, uri={}, duration={} ms",
                    invitationItem.getEventId(), invitationItem.getOperation(), htmlUrl, htmlURI, s3HtmlDurationMs);

            // Step 9: Update invitationHtmlEmail
            Map<String, Object> invitationHtmlEmail = new HashMap<>();
            invitationHtmlEmail.put("emailHtmlUrlS3Id", invitationQrData.getOrDefault("qrId", UUID.randomUUID().toString()));
            invitationHtmlEmail.put("emailHtmlUrlS3", htmlUrl);
            invitationHtmlEmail.put("emailHtmlURI", htmlURI);
            data.put("invitationHtmlEmail", invitationHtmlEmail);
            logger.info("Step 9: Updated invitationHtmlEmail: eventId={}, invitationId={}", invitationItem.getEventId(), invitationItem.getOperation());

            // Step 10: Update last modification timestamp
            Map<String, Object> invitationStatus = (Map<String, Object>) data.getOrDefault("invitationStatus", new HashMap<>());
            invitationStatus.put("lastModificationTimestamp", Instant.now().toString());
            data.put("invitationStatus", invitationStatus);
            logger.info("Step 10: Updated lastModificationTimestamp: eventId={}, invitationId={}", invitationItem.getEventId(), invitationItem.getOperation());

            // Step 11: Save updated invitation to DynamoDB
            long saveStart = System.nanoTime();
            invitationItem.setData(data);
            eventItemRepository.save(invitationItem);
            double saveDurationMs = (System.nanoTime() - saveStart) / 1_000_000.0;
            logger.info("Step 11: Updated invitation saved to DynamoDB: eventId={}, invitationId={}, duration={} ms",
                    invitationItem.getEventId(), invitationItem.getOperation(), saveDurationMs);

            // Step 12: Verify save
            Optional<EventItem> savedItem = eventItemRepository.findByEventIdAndOperation(invitationItem.getEventId(), invitationItem.getOperation());
            if (savedItem.isEmpty()) {
                logger.error("DynamoDB save verification failed: eventId={}, invitationId={}", invitationItem.getEventId(), invitationItem.getOperation());
                throw new RuntimeException("Failed to verify DynamoDB save for invitation: " + invitationItem.getOperation());
            }
            logger.info("Step 12: DynamoDB save verified: eventId={}, invitationId={}", invitationItem.getEventId(), invitationItem.getOperation());

            double totalDurationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            logger.info("Invitation data update completed: eventId={}, invitationId={}, totalDuration={} ms",
                    invitationItem.getEventId(), invitationItem.getOperation(), totalDurationMs);

        } catch (Exception e) {
            logger.error("Failed to update invitation data: eventId={}, invitationId={}, error={}",
                    invitationItem.getEventId(), invitationItem.getOperation(), e.getMessage(), e);
            throw new RuntimeException("Failed to update invitation data: " + e.getMessage(), e);
        }
    }

    private void updateBundles(String eventId, String bundleId, Map<String, Long> approvedTypeCounts, Map<String, Long> revokedTypeCounts) {
        logger.info("Updating bundles: eventId={}, bundleId={}", eventId, bundleId);

        EventItem bundlesItem = eventItemRepository.findByEventIdAndOperation(eventId, "bundles")
                .orElseThrow(() -> new RuntimeException("Bundles data not found for event: " + eventId));
        Map<String, Object> bundlesData = bundlesItem.getData();
        Map<String, Object> bundlesDataMap = (Map<String, Object>) bundlesData.getOrDefault("bundlesData", new HashMap<>());
        Map<String, Object> bundleData = (Map<String, Object>) bundlesDataMap.getOrDefault(bundleId, new HashMap<>());

        // Update approved counts
        if (!approvedTypeCounts.isEmpty()) {
            long approvedTotalQty = (long) bundleData.getOrDefault("approvedTotalQty", 0);
            Map<String, Long> approvedTypeQty = (Map<String, Long>) bundleData.getOrDefault("approvedTypeQty", new HashMap<>());

            approvedTotalQty += approvedTypeCounts.values().stream().mapToLong(Long::longValue).sum();
            approvedTypeCounts.forEach((type, count) ->
                    approvedTypeQty.merge(type, count, Long::sum));

            bundleData.put("approvedTotalQty", approvedTotalQty);
            bundleData.put("approvedTypeQty", approvedTypeQty);
        }

        // Update revoked counts
        if (!revokedTypeCounts.isEmpty()) {
            long revokedTotalQty = (long) bundleData.getOrDefault("revokedTotalQty", 0);
            Map<String, Long> revokedTypeQty = (Map<String, Long>) bundleData.getOrDefault("revokedTypeQty", new HashMap<>());

            revokedTotalQty += revokedTypeCounts.values().stream().mapToInt(Long::intValue).sum();
            revokedTypeCounts.forEach((type, count) ->
                    revokedTypeQty.merge(type, count, Long::sum));

            bundleData.put("revokedTotalQty", revokedTotalQty);
            bundleData.put("revokedTypeQty", revokedTypeQty);
        }

        bundlesDataMap.put(bundleId, bundleData);
        bundlesData.put("bundlesData", bundlesDataMap);
        bundlesItem.setData(bundlesData);
        eventItemRepository.save(bundlesItem);

        logger.info("Bundles updated: eventId={}, bundleId={}, approvedCounts={}, revokedCounts={}",
                eventId, bundleId, approvedTypeCounts, revokedTypeCounts);
    }

    private Map<String, Object> fetchEventDetails(String eventId) {
        logger.info("Fetching event details from DynamoDB: eventId={}, operation=core", eventId);
        Optional<EventItem> eventItem = eventItemRepository.findByEventIdAndOperation(eventId, "core");

        if (eventItem.isEmpty()) {
            logger.error("No core event item found in DynamoDB: eventId={}, operation=core", eventId);
            throw new RuntimeException("Event not found in DynamoDB for eventId: " + eventId);
        }

        Map<String, Object> data = eventItem.get().getData();
        if (data == null || data.isEmpty()) {
            logger.error("Event item data is empty: eventId={}, operation=core", eventId);
            throw new RuntimeException("Event data is empty for eventId: " + eventId);
        }

        Map<String, Object> coreData = (Map<String, Object>) data.getOrDefault("coreData", new HashMap<>());
        Map<String, Object> coreEventDates = (Map<String, Object>) data.getOrDefault("coreEventDates", new HashMap<>());
        if (coreData.isEmpty()) {
            logger.error("No coreData found in event item: eventId={}, operation=core", eventId);
            throw new RuntimeException("Core data not found for eventId: " + eventId);
        }
        if (coreEventDates.isEmpty()) {
            logger.error("No coreEventDates found in event item: eventId={}, operation=core", eventId);
            throw new RuntimeException("Core event dates not found for eventId: " + eventId);
        }

        Map<String, Object> eventDetails = new HashMap<>();
        eventDetails.put("name", coreData.getOrDefault("name", "Primavera Sound 2008"));
        eventDetails.put("startDate", coreData.getOrDefault("startDate", "2025-05-29T12:00:00Z"));
        eventDetails.put("endDate", coreData.getOrDefault("endDate", "2025-06-01T23:59:00Z"));
        eventDetails.put("venue", coreData.getOrDefault("venue", "Parc del Fòrum"));
        eventDetails.put("location", coreData.getOrDefault("venue", "Parc del Fòrum") + ", " +
                coreData.getOrDefault("city", "Barcelona") + ", " +
                coreData.getOrDefault("country", "Spain"));
        eventDetails.put("city", coreData.getOrDefault("city", "Barcelona"));
        eventDetails.put("country", coreData.getOrDefault("country", "Spain"));
        eventDetails.put("eventDates", coreEventDates);
        eventDetails.put("description", coreData.getOrDefault("description", "One of Europe’s biggest music festivals..."));
        eventDetails.put("logoUrl", coreData.getOrDefault("logoUrl", "https://example.com/primavera-logo.png"));
        eventDetails.put("websiteUrl", coreData.getOrDefault("websiteUrl", "https://www.primaverasound.com"));

        logger.info("Successfully fetched event details: eventId={}, operation=core", eventId);
        return eventDetails;
    }

    private Context createEmailContext(Map<String, Object> invitationData, Map<String, Object> eventDetails,
                                       Map<String, Object> invitationTemplate) {
        Context context = new Context();
        Map<String, Object> contact = (Map<String, Object>) invitationData.getOrDefault("invitationContact", new HashMap<>());
        Map<String, Object> customFields = (Map<String, Object>) invitationTemplate.getOrDefault("customFields", new HashMap<>());

        context.setVariable("contactName", contact.getOrDefault("name", ""));
        context.setVariable("contactEmail", contact.getOrDefault("email", ""));
        context.setVariable("eventName", customFields.getOrDefault("eventName", eventDetails.getOrDefault("name", "")));
        context.setVariable("eventDates", formatDates((Map<String, String>) eventDetails.getOrDefault("eventDates", new HashMap<>())));
        context.setVariable("invitationDates", formatDates((Map<String, String>) invitationData.getOrDefault("invitationDates", new HashMap<>())));
        context.setVariable("eventLocation", customFields.getOrDefault("eventLocation", eventDetails.getOrDefault("location", "")));
        context.setVariable("eventDescription", customFields.getOrDefault("eventDescription", eventDetails.getOrDefault("description", "")));
        context.setVariable("logoUrl", customFields.getOrDefault("logoUrl", "https://www.tailorbrands.com/wp-content/uploads/2021/05/nike-300x300.png"));
        context.setVariable("qrCodeImage", ((Map<String, String>) invitationData.getOrDefault("invitationQrData", Map.of())).getOrDefault("qrImageUrlS3", ""));

        logger.debug("Email context created: eventId={}, variables={}", invitationData.get("codeInvitation"), context.getVariableNames());
        return context;
    }

    private String formatDates(Map<String, String> dates) {
        if (dates == null || dates.isEmpty()) {
            return "";
        }
        return dates.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> entry.getValue().substring(0, 10))
                .collect(Collectors.joining(", "));
    }
}