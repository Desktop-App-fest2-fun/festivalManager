package fun.fest2.event.invitations;

import com.vaadin.hilla.Endpoint;
import jakarta.annotation.Nonnull;
import jakarta.validation.constraints.NotNull;
import fun.fest2.event.invitations.notifications.ProgressNotificationService;
import org.apache.logging.log4j.util.BiConsumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Component
@Endpoint
@AnonymousAllowed
public class InvitationEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(InvitationEndpoint.class);
    private final CreateInvitationsService createInvitationsService;
    private final UpdateInvitationService updateInvitationService;
    private final SendInvitationService sendInvitationService;
    private final ProgressNotificationService notificationService;

    @Autowired
    public InvitationEndpoint(CreateInvitationsService createInvitationsService, UpdateInvitationService updateInvitationService, SendInvitationService sendInvitationService, ProgressNotificationService notificationService) {
        this.createInvitationsService = createInvitationsService;
        this.updateInvitationService = updateInvitationService;
        this.sendInvitationService = sendInvitationService;
        this.notificationService = notificationService;
    }


    public String createInvitations(
            @Nonnull String eventId,
            @Nonnull List<Map<String, Object>> contacts,
            @Nonnull Map<String, Object> invitationTemplate,
            @Nonnull Map<String, Object> uploadMetadata) {
        long totalStart = System.nanoTime();
        logger.info("ENDPOINT: Received request to create invitations: eventId={}, contactsCount={}", eventId, contacts.size());

        try {
            CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
                try {
                    List<String> invitationIds = createInvitationsService.createInvitations(eventId, contacts, invitationTemplate, uploadMetadata);
                    double totalDurationMs = (System.nanoTime() - totalStart) / 1_000_000.0;
                    logger.info("ENDPOINT: Completed invitation creation and updating: eventId={}, duration={} ms", eventId, totalDurationMs);

                    return String.format("Invitation IDs: %s, Quantity: %d, Duration: %.2f ms",
                            String.join(",", invitationIds), invitationIds.size(), totalDurationMs);
                } catch (Exception e) {
                    logger.error("Failed to create invitations: eventId={}, error={}", eventId, e.getMessage());
                    return "Error creating invitations: " + e.getMessage();
                }
            });

            return future.join(); // Wait for the result
        } catch (Exception e) {
            logger.error("Error processing invitations: eventId={}, error={}", eventId, e.getMessage());
            return "Error creating invitations: " + e.getMessage();
        }
    }

    public Flux<Map<String, String>> subscribeToInvitations(@Nonnull String eventId) {
        return Flux.create(sink -> {
            BiConsumer<String, Map<String, String>> listener = (eId, result) -> {
                if (eId.equals(eventId)) {
                    sink.next(result);
                }
            };
            notificationService.addInvitationListener(listener);
            sink.onDispose(() -> notificationService.invitationListeners.remove(listener));
        });
    }



    @Async
    @AnonymousAllowed
    public @Nonnull CompletableFuture<Void> sendInvitations(
            @NotNull String eventId,
            @NotNull List<String> invitationIds) {
        logger.info("Received request to send invitations: eventId={}, invitationCount={}", eventId, invitationIds.size());
        return CompletableFuture.runAsync(() -> {
            try {
                sendInvitationService.sendInvitations(eventId, invitationIds);
                logger.info("Completed email sending: eventId={}", eventId);
            } catch (Exception e) {
                logger.error("Failed to send invitations: eventId={}, error={}", eventId, e.getMessage());
                throw new RuntimeException("Error sending invitations: " + e.getMessage());
            }
        });
    }

    @Async
    @AnonymousAllowed
    public @NotNull CompletableFuture<Void> updateInvitation(
            @NotNull String eventId,
            @NotNull List<String> invitationIds,
            String templateId,
            Map<String, Object> invitationData,
            @NotNull String updateOperation) {
        logger.info("Received request to update invitations: eventId={}, invitationCount={}, operation={}",
                eventId, invitationIds.size(), updateOperation);
        return CompletableFuture.runAsync(() -> {
            try {
                updateInvitationService.updateInvitation(eventId, invitationIds, templateId,  invitationData, updateOperation);
                logger.info("Completed invitation updates: eventId={}, operation={}", eventId, updateOperation);
            } catch (Exception e) {
                logger.error("Failed to update invitations: eventId={}, operation={}, error={}",
                        eventId, updateOperation, e.getMessage());
                throw new RuntimeException("Error updating invitations: " + e.getMessage());
            }
        });
    }


}

