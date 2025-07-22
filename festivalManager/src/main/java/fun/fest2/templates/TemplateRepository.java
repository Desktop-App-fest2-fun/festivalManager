package fun.fest2.templates;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class TemplateRepository {

    private static final Logger logger = LoggerFactory.getLogger(TemplateRepository.class);
    private final DynamoDbTable<Template> templateTable;

    @Autowired
    public TemplateRepository(DynamoDbEnhancedClient enhancedClient) {
        this.templateTable = enhancedClient.table("templates", TableSchema.fromBean(Template.class));
    }

    public List<Template> findAll() {
        try {
            List<Template> items = templateTable.scan()
                    .items()
                    .stream()
                    .collect(Collectors.toList());
            logger.info("Fetched {} templates from DynamoDB (full scan)", items.size());
            return items;
        } catch (Exception e) {
            logger.error("Failed to scan all templates", e);
            throw new RuntimeException("Error scanning Templates: " + e.getMessage());
        }
    }

    public void save(Template template) {
        if (template == null || template.getTemplateId() == null || template.getTemplateId() == null) {
            logger.error("Invalid Template: null or missing keys");
            throw new IllegalArgumentException("Template and its keys are required");
        }

        try {
            templateTable.putItem(template);
            logger.info("Saved Template: templateId={}, userId={}", template.getTemplateId(), template.getTemplateId());
        } catch (Exception e) {
            logger.error("Failed to save Template: templateId={}, userId={}",
                    template.getTemplateId(), template.getTemplateId(), e);
            throw new RuntimeException("Error saving Template: " + e.getMessage());
        }
    }

    public List<Template> findByTemplateId(String templateId) {
        if (templateId == null || templateId.trim().isEmpty()) {
            logger.error("Invalid templateId: null or empty");
            throw new IllegalArgumentException("templateId is required");
        }

        try {
            Key key = Key.builder().partitionValue(templateId).build();
            List<Template> items = templateTable.query(QueryConditional.keyEqualTo(key))
                    .items()
                    .stream()
                    .collect(Collectors.toList());

            logger.info("Found {} templates for templateId={}", items.size(), templateId);
            return items;
        } catch (Exception e) {
            logger.error("Failed to query templates for templateId={}", templateId, e);
            throw new RuntimeException("Error querying Templates: " + e.getMessage());
        }
    }

    public Optional<Template> findByTemplateIdAndOperation(String templateId, String operation) {
        if (templateId == null || templateId.trim().isEmpty() || operation == null || operation.trim().isEmpty()) {
            logger.error("Invalid parameters: templateId or userId is null/empty");
            throw new IllegalArgumentException("templateId and userId are required");
        }

        try {
            Key key = Key.builder()
                    .partitionValue(templateId)
                    .sortValue(operation)
                    .build();
            Template item = templateTable.getItem(key);

            if (item != null) {
                logger.info("Found Template: templateId={}, userId={}", templateId, operation);
                return Optional.of(item);
            } else {
                logger.info("No Template found for templateId={}, userId={}", templateId, operation);
                return Optional.empty();
            }
        } catch (Exception e) {
            logger.error("Failed to fetch Template: templateId={}, userId={}", templateId, operation, e);
            throw new RuntimeException("Error fetching Template: " + e.getMessage());
        }
    }

    public void delete(String templateId, String userId) {
        if (templateId == null || templateId.trim().isEmpty() || userId == null || userId.trim().isEmpty()) {
            logger.error("Invalid parameters: templateId or userId is null/empty");
            throw new IllegalArgumentException("templateId and userId are required");
        }

        try {
            Key key = Key.builder()
                    .partitionValue(templateId)
                    .sortValue(userId)
                    .build();
            templateTable.deleteItem(key);
            logger.info("Deleted Template: templateId={}, userId={}", templateId, userId);
        } catch (Exception e) {
            logger.error("Failed to delete Template: templateId={}, userId={}", templateId, userId, e);
            throw new RuntimeException("Error deleting Template: " + e.getMessage());
        }
    }

    public void batchSave(List<Template> items) {
        if (items == null || items.isEmpty()) {
            logger.warn("Empty batch save request");
            return;
        }

        try {
            List<Template> itemsToWrite = items.stream()
                    .filter(item -> item != null && item.getTemplateId() != null && item.getTemplateId() != null)
                    .toList();

            if (itemsToWrite.size() < items.size()) {
                logger.warn("Filtered out {} invalid templates from batch", items.size() - itemsToWrite.size());
            }

            itemsToWrite.forEach(templateTable::putItem);

            logger.info("Successfully batch saved {} templates", itemsToWrite.size());
        } catch (Exception e) {
            logger.error("Batch save operation failed", e);
            throw new RuntimeException("Batch save failed: " + e.getMessage(), e);
        }
    }

    public void batchDelete(List<Template> items) {
        if (items == null || items.isEmpty()) {
            logger.warn("Empty batch delete request");
            return;
        }

        try {
            List<Template> validItems = items.stream()
                    .filter(item -> item != null && item.getTemplateId() != null && item.getTemplateId() != null)
                    .toList();

            if (validItems.size() < items.size()) {
                logger.warn("Filtered out {} invalid templates from batch delete", items.size() - validItems.size());
            }

            int chunkSize = 25;
            List<List<Template>> chunks = new ArrayList<>();
            for (int i = 0; i < validItems.size(); i += chunkSize) {
                chunks.add(validItems.subList(i, Math.min(i + chunkSize, validItems.size())));
            }

            for (List<Template> chunk : chunks) {
                chunk.forEach(item -> {
                    Key key = Key.builder()
                            .partitionValue(item.getTemplateId())
                            .sortValue(item.getTemplateId())
                            .build();
                    templateTable.deleteItem(key);
                });
            }

            logger.info("Successfully batch deleted {} templates ({} chunks)", validItems.size(), chunks.size());
        } catch (Exception e) {
            logger.error("Batch delete operation failed", e);
            throw new RuntimeException("Batch delete failed: " + e.getMessage(), e);
        }
    }
}