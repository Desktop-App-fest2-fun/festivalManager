package fun.fest2.event.invitations;

import fun.fest2.event.EventItem;
import fun.fest2.event.EventItemRepository;
import fun.fest2.event.invitations.notifications.ProgressNotificationService;
import fun.fest2.event.invitations.s3Service.S3Service;
import fun.fest2.event.invitations.qrCreation.QrService;
import fun.fest2.templates.Template;
import fun.fest2.templates.TemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class CreateInvitationsService {

    private static final Logger logger = LoggerFactory.getLogger(CreateInvitationsService.class);
    private static final int MAX_THREADS = 30;

    private final EventItemRepository eventItemRepository;
    private final QrService qrService;
    private final S3Service s3Service;
    private final TemplateRepository templateRepository;
    private final SpringTemplateEngine templateEngine;
    private final ExecutorService executorService;
    private final ProgressNotificationService notificationService;

    @Autowired
    public CreateInvitationsService(EventItemRepository eventItemRepository, QrService qrService,
                                    S3Service s3Service, TemplateRepository templateRepository,
                                    SpringTemplateEngine templateEngine,
                                    ProgressNotificationService notificationService) {
        this.eventItemRepository = eventItemRepository;
        this.qrService = qrService;
        this.s3Service = s3Service;
        this.templateRepository = templateRepository;
        this.templateEngine = templateEngine;
        this.executorService = Executors.newFixedThreadPool(MAX_THREADS);
        this.notificationService = notificationService;
    }

    public List<String> createInvitations(
            String eventId,
            List<Map<String, Object>> contacts,
            Map<String, Object> invitationTemplate,
            Map<String, Object> uploadMetadata) {
        long totalStart = System.nanoTime();
        logger.info("CREATING: Starting invitation creation: eventId={}, totalContacts={}", eventId, contacts.size());

        int startIndex = getNextStartIndex(eventId);
        List<CompletableFuture<Map<String, String>>> futures = new ArrayList<>();
        for (int i = 0; i < contacts.size(); i++) {
            final Map<String, Object> contact = contacts.get(i);
            final String invitationId = String.format("invitation#INV%04d", startIndex + i + 1);
            futures.add(CompletableFuture.supplyAsync(() -> {
                Map<String, String> result = processInvitation(eventId, invitationId, contact, invitationTemplate, uploadMetadata);
                if (result != null) {
                    notificationService.notifyInvitationCreated(eventId, result);
                }
                return result;
            }, executorService));
        }

        // Wait for all invitations to be created and processed individually in parallel threads
        List<Map<String, String>> invitationResults = futures.stream()
                .map(future -> {
                    try {
                        return future.join();
                    } catch (Exception e) {
                        logger.error("Failed to process an invitation: eventId={}, error={}", eventId, e.getMessage(), e);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // Extract successful contacts and invitationIds from invitationResults list
        List<Map<String, Object>> successfulContacts = new ArrayList<>();
        List<String> successfulInvitationIds = new ArrayList<>();
        List<Map<String, Object>> successfulQuotaTypeByBundle = new ArrayList<>();
        Map<String, Map<String, Integer>> bundleQuotaCounts = new HashMap<>();

        for (Map<String, String> result : invitationResults) {
            int index = Integer.parseInt(result.get("invitationId").replace("invitation#INV", "")) - startIndex - 1;
            Map<String, Object> contact = contacts.get(index);
            successfulContacts.add(contact);
            successfulInvitationIds.add(result.get("invitationId"));

            String bundle = (String) contact.get("bundle");
            String quotaType = (String) contact.getOrDefault("invitationType", "GENERAL");

            bundleQuotaCounts.computeIfAbsent(bundle, k -> new HashMap<>())
                    .merge(quotaType, 1, Integer::sum);
        }

        // Convert bundleQuotaCounts to successfulQuotaTypeByBundle list
        for (Map.Entry<String, Map<String, Integer>> entry : bundleQuotaCounts.entrySet()) {
            Map<String, Object> bundleData = new HashMap<>();
            bundleData.put("bundle", entry.getKey());
            bundleData.put("quotaTypes", entry.getValue());
            successfulQuotaTypeByBundle.add(bundleData);
        }

        // Group contacts by bundle and update
        long bundleUpdateStart = System.nanoTime();
        Map<String, List<Map<String, Object>>> contactsByBundle = successfulContacts.stream()
                .collect(Collectors.groupingBy(contact -> (String) contact.get("bundle")));
        for (Map.Entry<String, List<Map<String, Object>>> entry : contactsByBundle.entrySet()) {
            String bundle = entry.getKey();
            List<Map<String, Object>> bundleContacts = entry.getValue();
            List<String> bundleInvitationIds = bundleContacts.stream()
                    .map(c -> successfulInvitationIds.get(successfulContacts.indexOf(c)))
                    .collect(Collectors.toList());
            updateBundle(eventId, bundle, bundleContacts, bundleInvitationIds);
        }
        double bundleUpdateDurationMs = (System.nanoTime() - bundleUpdateStart) / 1_000_000.0;
        logger.info("UPDATING: Completed updated bundle: eventId={} duration={} ms", eventId, bundleUpdateDurationMs);
        notificationService.notifyInvitationsCompleted(eventId, successfulInvitationIds);

        // Update bundles operation: creation status by type quota
        long bundlesUpdateStart = System.nanoTime();
        updateBundles(eventId, successfulQuotaTypeByBundle);
        double bundlesUpdateDurationMs = (System.nanoTime() - bundlesUpdateStart) / 1_000_000.0;
        logger.info("UPDATING: Completed updated bundles: eventId={} duration={} ms", eventId, bundlesUpdateDurationMs);

        // Update total time duration
        double totalDurationMs = (System.nanoTime() - totalStart) / 1_000_000.0;
        logger.info("CREATING: Completed invitation creation: eventId={}, totalDuration={} ms, successfulInvitations={}",
                eventId, totalDurationMs, invitationResults.size());
        return successfulInvitationIds;
    }

    private Map<String, String> processInvitation(
            String eventId,
            String invitationId,
            Map<String, Object> contact,
            Map<String, Object> invitationTemplate,
            Map<String, Object> uploadMetadata) {
        long invitationStart = System.nanoTime();
        logger.info("Processing invitation: eventId={}, operation={}", eventId, invitationId);
        Map<String, String> urls = new HashMap<>();

        // Initialize invitation item
        EventItem invitationItem = new EventItem(eventId, invitationId);
        Map<String, Object> data = new HashMap<>();

        try {
            // Step 1: Fetch event details from DynamoDB
            Map<String, Object> eventDetails = fetchEventDetails(eventId);
            data.put("invitationCode", String.format("EVENT#%s#%s", eventId.replace("EVENT_", ""), invitationId.replace("invitation#", "")));
            data.put("eventDetails", eventDetails);
            data.put("invitationContact", Map.of(
                    "name", contact.getOrDefault("name", ""),
                    "email", contact.getOrDefault("email", ""),
                    "invitationType", contact.getOrDefault("invitationType", "")
            ));
            data.put("invitationDates", contact.getOrDefault("invitationDates", new HashMap<>()));
            data.put("invitationTemplate", invitationTemplate);
            data.put("invitationData", Map.of(
                    "invitationType", contact.getOrDefault("invitationType", ""),
                    "bundle", contact.getOrDefault("bundle", ""),
                    "uploadBy", "test-fake-data",
                    "uploadType", contact.getOrDefault("uploadType", ""),
                    "uploadTimestamp", contact.getOrDefault("uploadTimestamp", LocalDateTime.now().toString())
            ));
            logger.info("Step 1: Core invitation populated: eventId={}, operation={}", eventId, invitationId);

            // Step 2: Save core invitation data to DynamoDB
            long saveStart = System.nanoTime();
            invitationItem.setData(data);
            eventItemRepository.save(invitationItem);
            double saveDurationMs = (System.nanoTime() - saveStart) / 1_000_000.0;
            logger.info("Step 2: Core invitation saved to DynamoDB: eventId={}, operation={}, duration={} ms", eventId, invitationId, saveDurationMs);

            // Verify save
            Optional<EventItem> savedItem = eventItemRepository.findByEventIdAndOperation(eventId, invitationId);
            if (savedItem.isEmpty()) {
                logger.error("DynamoDB save verification failed: eventId={}, operation={}", eventId, invitationId);
                throw new RuntimeException("Failed to verify DynamoDB save for invitation: " + invitationId);
            }
            logger.info("Step 2-B: DynamoDB save verified: eventId={}, operation={}", eventId, invitationId);

            // Step 3: Generate QR code
            long qrStart = System.nanoTime();
            String qrId = UUID.randomUUID().toString();
            byte[] qrImage = qrService.generateQRCode(qrId);
            double qrDurationMs = (System.nanoTime() - qrStart) / 1_000_000.0;
            logger.info("Step 3: QR generated: eventId={}, operation={}, duration={} ms", eventId, invitationId, qrDurationMs);

            // Step 4: Upload QR to S3
            long s3QrStart = System.nanoTime();
            String qrUrl = s3Service.uploadQrImage(qrImage, eventId, invitationId);
            String qrURI = String.format("s3://fest2fun-invites/fest2fun/%s/qrImages/%s.png", eventId, invitationId);
            double s3QrDurationMs = (System.nanoTime() - s3QrStart) / 1_000_000.0;
            logger.info("Step 4: S3 QR uploaded: eventId={}, operation={}, url={}, uri={}, duration={} ms", eventId, invitationId, qrUrl, qrURI, s3QrDurationMs);
            urls.put("qrImageUrlS3", qrUrl);

            // Step 5: Render HTML
            long templateStart = System.nanoTime();
            String templateId = (String) invitationTemplate.getOrDefault("templateId", "WHITE");
            Template template = templateRepository.findByTemplateIdAndOperation(templateId, "template")
                    .orElseThrow(() -> new RuntimeException("Template not found: " + templateId));
            Context context = createEmailContext(data, eventDetails, invitationTemplate, qrUrl);
            String htmlContent = templateEngine.process(template.getData().get("content").toString(), context);
            double templateDurationMs = (System.nanoTime() - templateStart) / 1_000_000.0;
            logger.info("Step 5: Template rendered: eventId={}, operation={}, templateId={}, duration={} ms",
                    eventId, invitationId, templateId, templateDurationMs);

            // Step 6: Upload HTML to S3
            long s3HtmlStart = System.nanoTime();
            String htmlUrl = s3Service.uploadEmailHtml(htmlContent, eventId, invitationId);
            String htmlURI = String.format("s3://fest2fun-invites/fest2fun/%s/emailHTML/%s.html", eventId, invitationId);
            double s3HtmlDurationMs = (System.nanoTime() - s3HtmlStart) / 1_000_000.0;
            logger.info("Step 6: S3 HTML uploaded: eventId={}, operation={}, url={}, uri={}, duration={} ms",
                    eventId, invitationId, htmlUrl, htmlURI, s3HtmlDurationMs);
            urls.put("emailHtmlUrlS3", htmlUrl);

            // Step 7: Update invitation with QR, HTML, and status data
            try {
                logger.warn("Step 7: Update invitation with QR, HTML, and status data for eventId={}, operation={}; using UUID: {}", eventId, invitationId, qrId);
                String createdTimestamp = LocalDateTime.now().toString();
                data.put("invitationQrData", Map.of(
                        "qrId", qrId,
                        "qrContent", qrId,
                        "qrImageUrlS3", urls.getOrDefault("qrImageUrlS3", ""),
                        "qrURI", qrURI
                ));
                data.put("invitationHtmlEmail", Map.of(
                        "emailHtmlUrlS3Id", qrId,
                        "emailHtmlUrlS3", urls.getOrDefault("emailHtmlUrlS3", ""),
                        "emailHtmlURI", htmlURI
                ));
                data.put("invitationStatus", Map.of(
                        "CREATED", Map.of(
                                "createdBy", "admin",
                                "createdTimestamp", createdTimestamp,
                                "createdSource", contact.getOrDefault("uploadType", "csv").toString(),
                                "statusCreated", true
                        ),
                        "currentStatus", "CREATED",
                        "lastModificationTimestamp", createdTimestamp
                ));
            } catch (Exception e) {
                logger.error("Failed to populate QR, email, or status data: eventId={}, operation={}, error={}", eventId, invitationId, e.getMessage());
                throw new RuntimeException("Failed to populate QR, email, or status data: " + e.getMessage());
            }

            // Step 8: Save updated invitation to DynamoDB
            saveStart = System.nanoTime();
            invitationItem.setData(data);
            eventItemRepository.save(invitationItem);
            saveDurationMs = (System.nanoTime() - saveStart) / 1_000_000.0;
            logger.info("Step 8: Updated invitation saved to DynamoDB: eventId={}, operation={}, duration={} ms", eventId, invitationId, saveDurationMs);

            // Verify final save
            savedItem = eventItemRepository.findByEventIdAndOperation(eventId, invitationId);
            if (savedItem.isEmpty()) {
                logger.error("DynamoDB final save verification failed: eventId={}, operation={}", eventId, invitationId);
                throw new RuntimeException("Failed to verify final DynamoDB save for invitation: " + invitationId);
            }
            logger.info("Step 9: DynamoDB final save verified: eventId={}, operation={}", eventId, invitationId);

            urls.put("invitationId", invitationId);
            urls.put("status", "Created");

            double invitationDurationMs = (System.nanoTime() - invitationStart) / 1_000_000.0;
            logger.info("Step 10: Invitation processed: eventId={}, operation={}, totalDuration={} ms",
                    eventId, invitationId, invitationDurationMs);

            return urls;

        } catch (Exception e) {
            logger.error("Invitation processing failed: eventId={}, operation={}, error={}",
                    eventId, invitationId, e.getMessage(), e);
            return null; // Return null to indicate failure
        }
    }

    /* ------------------------------  UTILS  ----------------------------------------*/

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

        Map<String, Object> coreData = (Map<String, Object>) data.get("coreData");
        Map<String, Object> coreEventDates = (Map<String, Object>) data.get("coreEventDates");
        if (coreData == null || coreData.isEmpty()) {
            logger.error("No coreData found in event item: eventId={}, operation=core", eventId);
            throw new RuntimeException("Core data not found for eventId: " + eventId);
        }
        if (coreEventDates == null || coreEventDates.isEmpty()) {
            logger.error("No coreEventDates found in event item: eventId={}, operation=core", eventId);
            throw new RuntimeException("Core event dates not found for eventId: " + eventId);
        }

        // Construct eventDetails with only necessary fields
        Map<String, Object> eventDetails = new HashMap<>();
        eventDetails.put("name", coreData.getOrDefault("name", "Primavera Sound 2008"));
        eventDetails.put("startDate", coreData.getOrDefault("startDate", "2025-05-29T12:00:00Z"));
        eventDetails.put("endDate", coreData.getOrDefault("endDate", "2025-06-01T23:59:00Z"));
        eventDetails.put("venue", coreData.getOrDefault("venue", "Parc del Fòrum"));
        eventDetails.put("city", coreData.getOrDefault("city", "Barcelona"));
        eventDetails.put("country", coreData.getOrDefault("country", "Spain"));
        eventDetails.put("eventDates", coreEventDates);
        eventDetails.put("description", coreData.getOrDefault("description", "One of Europe’s biggest music festivals..."));
        eventDetails.put("logoUrl", coreData.getOrDefault("logoUrl", "https://example.com/primavera-logo.png"));
        eventDetails.put("websiteUrl", coreData.getOrDefault("websiteUrl", "https://www.primaverasound.com"));

        logger.info("Successfully fetched event details: eventId={}, operation=core", eventId);
        return eventDetails;
    }

    private Context createEmailContext(
            Map<String, Object> invitationData,
            Map<String, Object> eventDetails,
            Map<String, Object> invitationTemplate,
            String qrUrl) {
        Context context = new Context();
        Map<String, Object> contact = (Map<String, Object>) invitationData.get("invitationContact");
        Map<String, Object> customFields = (Map<String, Object>) invitationTemplate.getOrDefault("customFields", new HashMap<>());

        context.setVariable("contactName", contact.getOrDefault("name", ""));
        context.setVariable("contactEmail", contact.getOrDefault("email", ""));
        context.setVariable("eventName", customFields.getOrDefault("eventName", eventDetails.getOrDefault("name", "")));
        context.setVariable("invitationDates", formatDates((Map<String, String>) invitationData.getOrDefault("invitationDates", new HashMap<>())));
        context.setVariable("eventLocation", customFields.getOrDefault("eventLocation", eventDetails.getOrDefault("venue", "") + ", " + eventDetails.getOrDefault("city", "") + ", " + eventDetails.getOrDefault("country", "")));
        context.setVariable("eventDescription", customFields.getOrDefault("eventDescription", eventDetails.getOrDefault("description", "")));
        context.setVariable("logoUrl", customFields.getOrDefault("logoUrl", "https://www.tailorbrands.com/wp-content/uploads/2021/05/nike-300x300.png"));
        context.setVariable("qrCodeImage", qrUrl);

        logger.debug("Email context created: eventId={}, variables={}", invitationData.get("invitationCode"), context.getVariableNames());
        return context;
    }

    private String formatDates(Map<String, String> dates) {
        if (dates == null || dates.isEmpty()) {
            return "";
        }
        return String.join(", ", dates.values());
    }

    private int getNextStartIndex(String eventId) {
        logger.debug("Fetching next start index for eventId={}", eventId);
        try {
            // Query DynamoDB for all invitations for the eventId with operation starting with "invitation#INV"
            List<EventItem> invitations = eventItemRepository.findByEventId(eventId)
                    .stream()
                    .filter(item -> item.getOperation() != null && item.getOperation().startsWith("invitation#INV"))
                    .collect(Collectors.toList());

            if (invitations.isEmpty()) {
                logger.debug("No existing invitations found for eventId={}, starting at index 0", eventId);
                return 0;
            }

            // Extract the highest invitation number (e.g., "invitation#INV0005" -> 5)
            int maxIndex = invitations.stream()
                    .map(item -> item.getOperation().replace("invitation#INV", ""))
                    .filter(str -> str.matches("\\d+")) // Ensure it's a number
                    .mapToInt(Integer::parseInt)
                    .max()
                    .orElse(0);

            logger.debug("Found max invitation index={} for eventId={}", maxIndex, eventId);
            return maxIndex;
        } catch (Exception e) {
            logger.error("Failed to fetch next start index for eventId={}, error={}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch next start index for event: " + eventId, e);
        }
    }

    /* ------------------------- UPDATERS ----------------------------------------------  */

    private void updateBundle(String eventId, String bundleOperation, List<Map<String, Object>> newContacts, List<String> newInvitationIds) {
        long bundleUpdateStart = System.nanoTime();
        logger.info("Updating bundle: eventId={}, bundleOperation={}", eventId, bundleOperation);

        try {
            // Fetch existing bundle
            EventItem bundleItem = eventItemRepository.findByEventIdAndOperation(eventId, bundleOperation)
                    .orElseThrow(() -> new RuntimeException("Bundle not found: " + bundleOperation));

            // Get top-level contacts and invitations
            List<Map<String, Object>> existingContacts = bundleItem.getContacts() != null ?
                    new ArrayList<>(bundleItem.getContacts()) : new ArrayList<>();
            List<Map<String, String>> existingInvitations = bundleItem.getInvitations() != null ?
                    new ArrayList<>(bundleItem.getInvitations()) : new ArrayList<>();

            // Update contacts
            existingContacts.addAll(newContacts);
            bundleItem.setContacts(existingContacts);

            // Update invitations
            newInvitationIds.forEach(id -> existingInvitations.add(Map.of("invitationSortKey", id)));
            bundleItem.setInvitations(existingInvitations);

            // Update bundleData (e.g., totalInvitations)
            Map<String, Object> bundleData = bundleItem.getData() != null ? bundleItem.getData() : new HashMap<>();
            Map<String, Object> bundleDataInner = (Map<String, Object>) bundleData.getOrDefault("bundleData", new HashMap<>());
            Number totalInvitationsNumber = (Number) bundleDataInner.getOrDefault("totalInvitations", 0);
            int totalInvitations = totalInvitationsNumber.intValue() + newInvitationIds.size();
            bundleDataInner.put("totalInvitations", totalInvitations);

            // Update state counts
            String invitationType = "GENERAL"; // Assuming it's GENERAL
            String state = "CREATED";
            Map<String, Map<String, Number>> stateCountsByType = (Map<String, Map<String, Number>>) bundleDataInner.getOrDefault("stateCountsByType", new HashMap<>());
            Map<String, Number> stateCounts = stateCountsByType.computeIfAbsent(invitationType, k -> new HashMap<>());
            Number currentCount = stateCounts.getOrDefault(state, 0);
            stateCounts.put(state, currentCount.intValue() + newInvitationIds.size());
            stateCountsByType.put(invitationType, stateCounts);
            bundleDataInner.put("stateCountsByType", stateCountsByType);

            bundleData.put("bundleData", bundleDataInner);
            bundleItem.setData(bundleData);

            // Save updated bundle
            long saveStart = System.nanoTime();
            eventItemRepository.save(bundleItem);
            double saveDurationMs = (System.nanoTime() - saveStart) / 1_000_000.0;
            logger.info("Bundle updated: eventId={}, bundleOperation={}, newContacts={}, newInvitationIds={}, saveDuration={} ms",
                    eventId, bundleOperation, newContacts.size(), newInvitationIds.size(), saveDurationMs);

            // Verify bundle save
            Optional<EventItem> savedBundle = eventItemRepository.findByEventIdAndOperation(eventId, bundleOperation);
            if (savedBundle.isEmpty()) {
                logger.error("DynamoDB bundle save verification failed: eventId={}, bundleOperation={}", eventId, bundleOperation);
                throw new RuntimeException("Failed to verify DynamoDB bundle save: " + bundleOperation);
            }
            logger.info("DynamoDB bundle save verified: eventId={}, bundleOperation={}", eventId, bundleOperation);

        } catch (Exception e) {
            logger.error("Bundle update failed: eventId={}, bundleOperation={}, error={}", eventId, bundleOperation, e.getMessage(), e);
            throw new RuntimeException("Failed to update bundle: " + bundleOperation, e);
        }

        double bundleUpdateDurationMs = (System.nanoTime() - bundleUpdateStart) / 1_000_000.0;
        logger.info("Bundle update completed: eventId={}, bundleOperation={}, duration={} ms", eventId, bundleOperation, bundleUpdateDurationMs);
    }

    private void updateBundles(String eventId, List<Map<String, Object>> successfulQuotaTypeByBundle) {
        long bundlesUpdateStart = System.nanoTime();
        logger.info("Updating bundles: eventId={}", eventId);

        try {
            // Fetch existing bundles item or create new if it doesn't exist
            EventItem bundlesItem = eventItemRepository.findByEventIdAndOperation(eventId, "bundles")
                    .orElseGet(() -> new EventItem(eventId, "bundles"));

            Map<String, Object> bundlesData = bundlesItem.getData() != null ? bundlesItem.getData() : new HashMap<>();
            Map<String, Object> bundlesDataInner = (Map<String, Object>) bundlesData.getOrDefault("bundlesData", new HashMap<>());

            for (Map<String, Object> bundleInfo : successfulQuotaTypeByBundle) {
                String bundle = (String) bundleInfo.get("bundle");
                Map<String, Integer> quotaTypes = (Map<String, Integer>) bundleInfo.get("quotaTypes");

                // Get or initialize bundle data
                Map<String, Object> bundleData = (Map<String, Object>) bundlesDataInner.computeIfAbsent(bundle, k -> new HashMap<>());

                // Update createdTypeQty
                Map<String, Number> createdTypeQty = (Map<String, Number>) bundleData.getOrDefault("createdTypeQty", new HashMap<>());
                for (Map.Entry<String, Integer> entry : quotaTypes.entrySet()) {
                    String type = entry.getKey();
                    int count = entry.getValue();
                    createdTypeQty.put(type, ((Number) createdTypeQty.getOrDefault(type, 0)).intValue() + count);
                }
                bundleData.put("createdTypeQty", createdTypeQty);

                // Update createdTotalQty
                int total = createdTypeQty.values().stream().mapToInt(Number::intValue).sum();
                bundleData.put("createdTotalQty", total);

                // Update bundlesDataInner
                bundlesDataInner.put(bundle, bundleData);
            }

            bundlesData.put("bundlesData", bundlesDataInner);
            bundlesItem.setData(bundlesData);

            // Save updated bundles item
            long saveStart = System.nanoTime();
            eventItemRepository.save(bundlesItem);
            double saveDurationMs = (System.nanoTime() - saveStart) / 1_000_000.0;
            logger.info("Bundles updated: eventId={}, saveDuration={} ms", eventId, saveDurationMs);

            // Verify save
            Optional<EventItem> savedBundles = eventItemRepository.findByEventIdAndOperation(eventId, "bundles");
            if (savedBundles.isEmpty()) {
                logger.error("DynamoDB bundles save verification failed: eventId={}", eventId);
                throw new RuntimeException("Failed to verify DynamoDB bundles save");
            }
            logger.info("DynamoDB bundles save verified: eventId={}", eventId);

        } catch (Exception e) {
            logger.error("Bundles update failed: eventId={}, error={}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to update bundles", e);
        }

        double bundlesUpdateDurationMs = (System.nanoTime() - bundlesUpdateStart) / 1_000_000.0;
        logger.info("Bundles update completed: eventId={}, duration={} ms", eventId, bundlesUpdateDurationMs);
    }
}