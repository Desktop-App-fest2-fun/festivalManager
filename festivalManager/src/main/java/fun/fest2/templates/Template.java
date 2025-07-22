package fun.fest2.templates;

import fun.fest2.mapConverters.NestedMapAttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;
import java.util.Map;
import java.util.Objects;

@DynamoDbBean
public class Template {
    private String templateId;
    private String operation;
    private Map<String, Object> data;

    public Template() {}

    public Template(String templateId, String operation) {
        this.templateId = templateId;
        this.operation = operation;
    }

    @DynamoDbPartitionKey
    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }

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
        Template contact = (Template) o;
        return Objects.equals(templateId, contact.templateId) &&
                Objects.equals(operation, contact.operation) &&
                Objects.equals(data, contact.data);
    }

    @Override
    public int hashCode() {
        return Objects.hash(templateId, operation, data);
    }
}
