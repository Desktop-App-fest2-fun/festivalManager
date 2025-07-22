package fun.fest2.event.guestCheckIn;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import org.springframework.beans.factory.annotation.Autowired;

@Endpoint
@AnonymousAllowed
public class GuestCheckInEndpoint {

    private final GuestCheckInService guestCheckInService;

    @Autowired
    public GuestCheckInEndpoint(GuestCheckInService guestCheckInService) {
        this.guestCheckInService = guestCheckInService;
    }

    public GuestCheckInService.GuestInfo validateGuestQr(String eventId, String operation, String qrId) {
        return guestCheckInService.validateGuestQr(eventId, operation, qrId);
    }

    public boolean assignBandWristId(String eventId, String operation, String qrId, String bandWristId) {
        return guestCheckInService.assignBandWristId(eventId, operation, qrId, bandWristId);
    }
}