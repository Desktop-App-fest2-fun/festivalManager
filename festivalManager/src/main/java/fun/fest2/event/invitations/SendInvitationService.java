package fun.fest2.event.invitations;

import fun.fest2.event.EventItem;
import fun.fest2.event.EventItemRepository;
import fun.fest2.event.invitations.emailService.EmailSendingService;
import fun.fest2.event.invitations.s3Service.S3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class SendInvitationService {

    private static final Logger logger = LoggerFactory.getLogger(SendInvitationService.class);
    private static final int THREAD_POOL_SIZE = 10;

    private final EventItemRepository eventItemRepository;
    private final S3Service s3Service;
    private final EmailSendingService emailSendingService;
    private final ExecutorService executorService;

    public SendInvitationService(EventItemRepository eventItemRepository, S3Service s3Service,
                                 EmailSendingService emailSendingService) {
        this.eventItemRepository = eventItemRepository;
        this.s3Service = s3Service;
        this.emailSendingService = emailSendingService;
        this.executorService = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
    }

    public @NotNull CompletableFuture<Void> sendInvitations(
            @NotNull String eventId,
            @NotNull List<String> invitationIds) {
        long totalStart = System.nanoTime();
        logger.info("Starting email sending: eventId={}, invitationCount={}", eventId, invitationIds.size());

        List<CompletableFuture<Void>> futures = invitationIds.stream()
                .map(invitationId -> CompletableFuture.runAsync(() -> processSendInvitation(eventId, invitationId), executorService))
                .collect(Collectors.toList());

        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).whenComplete((result, throwable) -> {
            double totalDurationMs = (System.nanoTime() - totalStart) / 1_000_000.0;
            if (throwable != null) {
                logger.error("Email sending failed: eventId={}, error={}", eventId, throwable.getMessage());
            } else {
                logger.info("Completed email sending: eventId={}, duration={} ms", eventId, totalDurationMs);
            }
        });
    }

    private void processSendInvitation(String eventId, String invitationId) {
        long startTime = System.nanoTime();
        logger.info("Processing email: eventId={}, invitationId={}", eventId, invitationId);

        try {
            EventItem invitationItem = eventItemRepository.findByEventIdAndOperation(eventId, invitationId)
                    .orElseThrow(() -> new RuntimeException("Invitation not found: " + invitationId));
            Map<String, Object> invitationData = invitationItem.getData();

            Map<String, Object> emailData = (Map<String, Object>) invitationData.getOrDefault("invitationHtmlEmail", Map.of());
            String htmlUrl = (String) emailData.getOrDefault("emailHtmlUrlS3", "");
            if (htmlUrl.isEmpty()) {
                logger.error("No HTML URL found: eventId={}, invitationId={}, emailData={}",
                        eventId, invitationId, emailData);
                throw new RuntimeException("No HTML URL for invitation: " + invitationId);
            }

            // Fetch HTML content from S3
            logger.info("Fetching HTML content from S3: eventId={}, invitationId={}, htmlUrl={}",
                    eventId, invitationId, htmlUrl);
            String htmlContent = s3Service.getHtmlContentFromS3(htmlUrl);
            if (htmlContent == null || htmlContent.isEmpty()) {
                logger.error("Failed to retrieve HTML content from S3: eventId={}, invitationId={}, htmlUrl={}",
                        eventId, invitationId, htmlUrl);
                throw new RuntimeException("Failed to retrieve HTML content for invitation: " + invitationId);
            }

            emailSendingService.sendInvitationEmail(invitationData, htmlContent);

            Map<String, Object> invitationStatus = (Map<String, Object>) invitationData.getOrDefault("invitationStatus", Map.of());
            invitationStatus.put("SENT", Map.of(
                    "sentBy", "admin",
                    "sentTimestamp", Instant.now().toString(),
                    "sentStatus", true
            ));
            invitationStatus.put("currentStatus", "SENT");
            invitationStatus.put("lastModificationTimestamp", Instant.now().toString());
            invitationData.put("invitationStatus", invitationStatus);

            invitationItem.setData(invitationData);
            eventItemRepository.save(invitationItem);

            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            logger.info("Email processing completed: eventId={}, invitationId={}, duration={} ms", eventId, invitationId, durationMs);

        } catch (Exception e) {
            logger.error("Email processing failed: eventId={}, invitationId={}, error={}", eventId, invitationId, e.getMessage());
            throw new RuntimeException("Failed to process email for: " + invitationId, e);
        }
    }
}