package fun.fest2.event;

import fun.fest2.mapConverters.NestedListAttributeConverter;
import fun.fest2.mapConverters.NestedMapAttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@DynamoDbBean
public class EventItem {
    private String eventId;
    private String operation;
    private Map<String, Object> data; // For core, statistics, artists data
    private List<Map<String, Object>> contacts; // First-level array
    private List<Map<String, Object>> templates; // First-level array
    private List<Map<String, Object>> eventDates; // First-level array
    private List<Map<String, Object>> artists; // First-level array
    private List<Map<String, String>> invitations; // First-level array, fixed to String,String

    public EventItem() {}

    public EventItem(String eventId, String operation) {
        this.eventId = eventId;
        this.operation = operation;
    }

    @DynamoDbPartitionKey
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    @DynamoDbSortKey
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }

    @DynamoDbAttribute("data")
    @DynamoDbConvertedBy(NestedMapAttributeConverter.class)
    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    @DynamoDbAttribute("contacts")
    @DynamoDbConvertedBy(NestedListAttributeConverter.class)
    public List<Map<String, Object>> getContacts() { return contacts; }
    public void setContacts(List<Map<String, Object>> contacts) {
        this.contacts = contacts;
    }

    @DynamoDbAttribute("templates")
    @DynamoDbConvertedBy(NestedListAttributeConverter.class)
    public List<Map<String, Object>> getTemplates() { return templates; }
    public void setTemplates(List<Map<String, Object>> templates) {
        this.templates = templates;
    }

    @DynamoDbAttribute("artists")
    @DynamoDbConvertedBy(NestedListAttributeConverter.class)
    public List<Map<String, Object>> getArtists() { return artists; }
    public void setArtists(List<Map<String, Object>> artists) {
        this.artists = artists;
    }

    @DynamoDbAttribute("eventDates")
    @DynamoDbConvertedBy(NestedListAttributeConverter.class)
    public List<Map<String, Object>> getEventDates() { return eventDates; }
    public void setEventDates(List<Map<String, Object>> eventDates) {
        this.eventDates = eventDates;
    }

    @DynamoDbAttribute("invitations")
    @DynamoDbConvertedBy(NestedListAttributeConverter.class)
    public List<Map<String, String>> getInvitations() { return invitations; }
    public void setInvitations(List<Map<String, String>> invitations) {
        this.invitations = invitations;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EventItem eventItem = (EventItem) o;
        return Objects.equals(eventId, eventItem.eventId) &&
                Objects.equals(operation, eventItem.operation) &&
                Objects.equals(data, eventItem.data) &&
                Objects.equals(contacts, eventItem.contacts) &&
                Objects.equals(artists, eventItem.artists) &&
                Objects.equals(eventDates, eventItem.eventDates) &&
                Objects.equals(invitations, eventItem.invitations) &&
                Objects.equals(templates, eventItem.templates);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventId, operation, data, contacts, templates, artists, eventDates, invitations);
    }
}