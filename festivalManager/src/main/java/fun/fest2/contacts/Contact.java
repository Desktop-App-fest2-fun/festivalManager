package fun.fest2.contacts;

import fun.fest2.mapConverters.NestedMapAttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;
import java.util.Map;
import java.util.Objects;

@DynamoDbBean
public class Contact {
    private String contactId;
    private String operation;
    private Map<String, Object> data;

    public Contact() {}

    public Contact(String contactId, String operation) {
        this.contactId = contactId;
        this.operation = operation;
    }

    @DynamoDbPartitionKey
    public String getContactId() { return contactId; }
    public void setContactId(String contactId) { this.contactId = contactId; }

    @DynamoDbSortKey
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }

    @DynamoDbAttribute("data")
    @DynamoDbConvertedBy(NestedMapAttributeConverter.class)
    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Contact contact = (Contact) o;
        return Objects.equals(contactId, contact.contactId) &&
                Objects.equals(operation, contact.operation) &&
                Objects.equals(data, contact.data);
    }

    @Override
    public int hashCode() {
        return Objects.hash(contactId, operation, data);
    }
}
