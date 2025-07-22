package fun.fest2.event.qrvalidator;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;

import org.springframework.beans.factory.annotation.Autowired;

@Endpoint
@AnonymousAllowed
public class QrValidationEndpoint {

    private final QrValidatorService qrValidatorService;

    @Autowired
    public QrValidationEndpoint(QrValidatorService qrValidatorService) {
        this.qrValidatorService = qrValidatorService;
    }

    public boolean validateQr(String eventId, String operation, String qrId) {
        return qrValidatorService.validateQr(eventId, operation, qrId);
    }
}