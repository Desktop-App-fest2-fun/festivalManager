package fun.fest2.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private static final int MAX_BATCH_SIZE = 25;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private final UserRepository repository;

    @Autowired
    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public List<User> findAll() {
        try {
            List<User> items = repository.findAll();
            logger.info("Fetched {} users from DynamoDB", items.size());
            return items;
        } catch (Exception e) {
            logger.error("Error fetching all users", e);
            throw new RuntimeException("Failed to fetch all users: " + e.getMessage());
        }
    }

    public List<User> findByUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Invalid userId: null or empty");
            throw new IllegalArgumentException("userId is required");
        }

        try {
            List<User> items = repository.findByUserId(userId);
            logger.info("Fetched {} users for userId={}", items.size(), userId);
            return items;
        } catch (Exception e) {
            logger.error("Error fetching users for userId={}", userId, e);
            throw new RuntimeException("Failed to fetch users: " + e.getMessage());
        }
    }

    public User findByUserIdAndOperation(String userId, String operation) {
        if (userId == null || userId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: userId or operation is null/empty");
            throw new IllegalArgumentException("userId and operation are required");
        }

        try {
            Optional<User> item = repository.findByUserIdAndOperation(userId, operation);
            if (item.isPresent()) {
                logger.info("Found user for userId={}, operation={}", userId, operation);
                return item.get();
            } else {
                logger.info("No user found for userId={}, operation={}", userId, operation);
                return null;
            }
        } catch (Exception e) {
            logger.error("Error fetching user for userId={}, operation={}", userId, operation, e);
            throw new RuntimeException("Failed to fetch user: " + e.getMessage());
        }
    }

    public void save(User user) {
        repository.save(user);
    }

    public void delete(String userId, String operation) {
        if (userId == null || userId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: userId or operation is null/empty");
            throw new IllegalArgumentException("userId and operation are required");
        }

        try {
            repository.delete(userId, operation);
            logger.info("Deleted user: userId={}, operation={}", userId, operation);
        } catch (Exception e) {
            logger.error("Error deleting user: userId={}, operation={}", userId, operation, e);
            throw new RuntimeException("Failed to delete user: " + e.getMessage());
        }
    }

    public int deleteByUserId(String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            logger.error("Invalid userId: null or empty");
            throw new IllegalArgumentException("userId is required");
        }

        try {
            List<User> users = repository.findByUserId(userId);
            if (users.isEmpty()) {
                logger.info("No users found for userId: {}", userId);
                return 0;
            }

            List<List<User>> chunks = partitionList(users);
            chunks.forEach(repository::batchDelete);
            logger.info("Deleted {} users for userId: {}", users.size(), userId);
            return users.size();
        } catch (Exception e) {
            logger.error("Failed to delete users for userId: {}", userId, e);
            throw new RuntimeException("Delete operation failed: " + e.getMessage());
        }
    }

    public List<User> batchSave(List<User> items) {
        try {
            List<List<User>> chunks = partitionList(items);
            chunks.forEach(repository::batchSave);
            logger.info("Successfully saved {} users in batches", items.size());
        } catch (Exception e) {
            logger.error("Batch save failed", e);
            throw new RuntimeException("Batch operation failed: " + e.getMessage());
        }
        return items;
    }

    private <T> List<List<T>> partitionList(List<T> list) {
        int numChunks = (int) Math.ceil((double) list.size() / MAX_BATCH_SIZE);
        List<List<T>> chunks = new ArrayList<>(numChunks);
        for (int i = 0; i < numChunks; i++) {
            int start = i * MAX_BATCH_SIZE;
            int end = Math.min((i + 1) * MAX_BATCH_SIZE, list.size());
            chunks.add(list.subList(start, end));
        }
        return chunks;
    }
}