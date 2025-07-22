package fun.fest2.event.invitations.emailService;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class EmailSendingService {

    private static final Logger logger = LoggerFactory.getLogger(EmailSendingService.class);
    private static final String FROM_EMAIL = "MS_BBiqQJ@test-51ndgwvzwmqlzqx8.mlsender.net";
    private static final int THREAD_POOL_SIZE = 10;

    private final JavaMailSender mailSender;
    private final ExecutorService executorService;

    public EmailSendingService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        this.executorService = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
    }

    public CompletableFuture<Void> sendInvitationEmails(
            @NotNull List<Map<String, Object>> invitations,
            @NotNull List<String> htmlContents
           ) {
        long startTime = System.nanoTime();
        if (invitations.size() != htmlContents.size() || invitations.size() != htmlContents.size()) {
            logger.error("Mismatched input sizes: invitations={}, htmlContents={},}",
                    invitations.size(), htmlContents.size() );
            throw new IllegalArgumentException("Input lists must have the same size");
        }

        List<CompletableFuture<Void>> futures = invitations.stream()
                .map((invitationData) -> {
                    int index = invitations.indexOf(invitationData);
                    return CompletableFuture.runAsync(() ->
                            sendInvitationEmail(invitationData, htmlContents.get(index)), executorService);
                })
                .collect(Collectors.toList());

        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).whenComplete((result, throwable) -> {
            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            if (throwable != null) {
                logger.error("Failed to send emails: error={}", throwable.getMessage());
            } else {
                logger.info("Completed sending {} emails: duration={} ms", invitations.size(), durationMs);
            }
        });
    }

    public void sendInvitationEmail(Map<String, Object> invitationData, String htmlContent) {
        long startTime = System.nanoTime();
        Map<String, Object> contact = (Map<String, Object>) invitationData.getOrDefault("invitationContact", Map.of());
        String toEmail = (String) contact.getOrDefault("email", "");
        String eventName = ((Map<String, Object>) invitationData.getOrDefault("event", Map.of())).getOrDefault("name", "Event").toString();
        String[] codeParts = ((String) invitationData.getOrDefault("codeInvitation", "")).split("#");
        String invitationId = codeParts.length > 1 ? codeParts[1] : codeParts[0];

        if (toEmail.isEmpty()) {
            logger.error("No email address provided: invitationId={}", invitationId);
            throw new RuntimeException("No email address for invitation: " + invitationId);
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            message.setFrom(FROM_EMAIL);
            message.addRecipient(jakarta.mail.Message.RecipientType.TO, new jakarta.mail.internet.InternetAddress(toEmail));
            message.setSubject("Your Invitation to " + eventName);
            message.setContent(htmlContent, "text/html; charset=UTF-8");

            mailSender.send(message);

            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            logger.info("Email sent successfully: invitationId={}, to={}, duration={} ms", invitationId, toEmail, durationMs);

        } catch (MessagingException e) {
            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            logger.error("Failed to send email: invitationId={}, to={}, error={}, duration={} ms",
                    invitationId, toEmail, e.getMessage(), durationMs);
            throw new RuntimeException("Failed to send email for: " + invitationId, e);
        }
    }
}