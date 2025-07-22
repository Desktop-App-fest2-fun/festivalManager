package fun.fest2.user;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.Endpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Endpoint
@AnonymousAllowed
public class UserEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(UserEndpoint.class);
    private final UserService userService;

    @Autowired
    public UserEndpoint(UserService userService) {
        this.userService = userService;
    }

    public List<Map<String, Object>> getAllUsers() {
        try {
            List<User> allItems = userService.findAll();
            if (allItems.isEmpty()) {
                logger.info("No users found in DynamoDB");
                return new ArrayList<>();
            }

            // Group by userId
            Map<String, Map<String, Object>> usersById = new HashMap<>();
            for (User item : allItems) {
                Map<String, Object> user = usersById.computeIfAbsent(item.getUserId(), k -> {
                    Map<String, Object> newUser = new HashMap<>();
                    newUser.put("userId", k);
                    return newUser;
                });

                // Add operation data
                Map<String, Object> operationData = new HashMap<>();
                if (item.getData() != null) {
                    operationData.putAll(item.getData());
                }
                // Include users array if present
                if (item.getUsers() != null) {
                    operationData.put("users", item.getUsers());
                }
                user.put(item.getOperation(), operationData);
            }

            logger.info("Retrieved {} users from DynamoDB", usersById.size());
            return new ArrayList<>(usersById.values());
        } catch (Exception e) {
            logger.error("Failed to retrieve all users", e);
            throw new RuntimeException("Error retrieving users: " + e.getMessage());
        }
    }

    public User getUserByIdAndOperation(String userId, String operation) {
        try {
            User item = userService.findByUserIdAndOperation(userId, operation);
            if (item != null) {
                logger.info("Retrieved User for userId={}, operation={}", userId, operation);
                return item;
            } else {
                logger.info("No User found for userId={}, operation={}", userId, operation);
                return null;
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve User for userId={}, operation={}", userId, operation, e);
            throw new RuntimeException("Error retrieving User: " + e.getMessage());
        }
    }

    public Map<String, Object> getUserById(String userId) {
        List<User> items = userService.findByUserId(userId);
        if (items.isEmpty()) {
            logger.info("No data found for userId={}", userId);
            return null;
        }

        Map<String, Object> user = new HashMap<>();
        user.put("userId", userId);

        for (User item : items) {
            Map<String, Object> operationData = new HashMap<>();
            if (item.getData() != null) {
                operationData.putAll(item.getData());
            }
            user.put(item.getOperation(), operationData);
        }

        return user;
    }

    public void saveUser(Map<String, Object> payload) {
        String userId = (String) payload.get("userId");
        String operation = (String) payload.get("operation");
        User item = new User(userId, operation);

        Map<String, Object> data = new HashMap<>(payload);
        data.remove("userId");
        data.remove("operation");

        if (!data.isEmpty()) {
            item.setData(data);
        }

        userService.save(item);
    }
}