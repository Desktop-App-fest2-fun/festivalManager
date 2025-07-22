package fun.fest2.user;

import fun.fest2.mapConverters.NestedListAttributeConverter;
import fun.fest2.mapConverters.NestedMapAttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@DynamoDbBean
public class User {
    private String userId;
    private String operation;
    private Map<String, Object> data;
    private List<Map<String, Object>> users;

    public User() {}

    public User(String userId, String operation) {
        this.userId = userId;
        this.operation = operation;
    }

    @DynamoDbPartitionKey
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    @DynamoDbSortKey
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }


    @DynamoDbAttribute("data")
    @DynamoDbConvertedBy(NestedMapAttributeConverter.class)
    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    @DynamoDbAttribute("users")
    @DynamoDbConvertedBy(NestedListAttributeConverter.class)
    public List<Map<String, Object>> getUsers() { return users; }
    public void setUsers(List<Map<String, Object>> users) {
        this.users = users;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(userId, user.userId) &&
                Objects.equals(operation, user.operation) &&
                Objects.equals(users, user.users) &&
                Objects.equals(data, user.data);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, operation, data, users);
    }
}
