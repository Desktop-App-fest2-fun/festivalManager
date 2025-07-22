package fun.fest2.event.invitations.notifications;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.server.VaadinSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.BiConsumer;

@Service
public class ProgressNotificationService {
    public final List<BiConsumer<String, Map<String, String>>> invitationListeners = new CopyOnWriteArrayList<>();
    public final List<BiConsumer<String, List<String>>> completionListeners = new CopyOnWriteArrayList<>();

    public void addInvitationListener(BiConsumer<String, Map<String, String>> listener) {
        invitationListeners.add(listener);
    }

    public void notifyInvitationCreated(String eventId, Map<String, String> invitationResult) {
        invitationListeners.forEach(listener -> listener.accept(eventId, invitationResult));
    }

    /*public void addCompletionListener(BiConsumer<String, List<String>> listener) {
        completionListeners.add(listener);
    }
*/
    public void notifyInvitationsCompleted(String eventId, List<String> invitationIds) {
        completionListeners.forEach(listener -> listener.accept(eventId, invitationIds));
    }
}

    /*private static final Logger logger = LoggerFactory.getLogger(ProgressNotificationService.class);
    private final Map<String, BiConsumer<Integer, String>> subscribers = new ConcurrentHashMap<>();

    public void subscribe(String clientId, BiConsumer<Integer, String> callback) {
        subscribers.put(clientId, callback);
        logger.info("Client subscribed to progress updates: clientId={}", clientId);
    }

    public void unsubscribe(String clientId) {
        subscribers.remove(clientId);
        logger.info("Client unsubscribed: clientId={}", clientId);
    }

    public void notifyProgress(String clientId, int invitationNumber, String status) {
        BiConsumer<Integer, String> callback = subscribers.get(clientId);
        if (callback != null) {
            // Ensure UI access is thread-safe
            UI ui = UI.getCurrent();
            if (ui != null) {
                ui.access(() -> {
                    callback.accept(invitationNumber, status);
                    logger.debug("Pushed progress update to clientId={}: Invitation #{}: {}", clientId, invitationNumber, status);
                });
            } else {
                logger.warn("No UI context available for clientId={}", clientId);
            }
        } else {
            logger.warn("No subscriber found for clientId={}", clientId);
        }
    }

    public void notifyCompletion(String clientId, String finalMessage) {
        BiConsumer<Integer, String> callback = subscribers.get(clientId);
        if (callback != null) {
            UI ui = UI.getCurrent();
            if (ui != null) {
                ui.access(() -> {
                    callback.accept(0, finalMessage);
                    logger.info("Pushed completion message to clientId={}: {}", clientId, finalMessage);
                });
            } else {
                logger.warn("No UI context available for clientId={}", clientId);
            }
            unsubscribe(clientId);
        } else {
            logger.warn("No subscriber found for clientId={}", clientId);
        }
    }*/
