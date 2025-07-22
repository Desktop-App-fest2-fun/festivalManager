package fun.fest2.templates;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class TemplateService {

    private static final int MAX_BATCH_SIZE = 25;
    private static final Logger logger = LoggerFactory.getLogger(TemplateService.class);
    private final TemplateRepository repository;

    @Autowired
    public TemplateService(TemplateRepository repository) {
        this.repository = repository;
    }

    public List<Template> findAll() {
        try {
            List<Template> items = repository.findAll();
            logger.info("Fetched {} templates from DynamoDB", items.size());
            return items;
        } catch (Exception e) {
            logger.error("Error fetching all templates", e);
            throw new RuntimeException("Failed to fetch all templates: " + e.getMessage());
        }
    }

    public List<Template> findByTemplateId(String templateId) {
        if (templateId == null || templateId.trim().isEmpty()) {
            logger.error("Invalid templateId: null or empty");
            throw new IllegalArgumentException("templateId is required");
        }

        try {
            List<Template> items = repository.findByTemplateId(templateId);
            logger.info("Fetched {} templates for templateId={}", items.size(), templateId);
            return items;
        } catch (Exception e) {
            logger.error("Error fetching templates for templateId={}", templateId, e);
            throw new RuntimeException("Failed to fetch templates: " + e.getMessage());
        }
    }

    public Template findByTemplateIdAndUserId(String templateId, String userId) {
        if (templateId == null || templateId.trim().isEmpty() || userId == null || userId.trim().isEmpty()) {
            logger.error("Invalid parameters: templateId or userId is null/empty");
            throw new IllegalArgumentException("templateId and userId are required");
        }

        try {
            Optional<Template> item = repository.findByTemplateIdAndOperation(templateId, userId);
            if (item.isPresent()) {
                logger.info("Found template for templateId={}, userId={}", templateId, userId);
                return item.get();
            } else {
                logger.info("No template found for templateId={}, userId={}", templateId, userId);
                return null;
            }
        } catch (Exception e) {
            logger.error("Error fetching template for templateId={}, userId={}", templateId, userId, e);
            throw new RuntimeException("Failed to fetch template: " + e.getMessage());
        }
    }

    public void save(Template template) {
        repository.save(template);
    }

    public void delete(String templateId, String userId) {
        if (templateId == null || templateId.trim().isEmpty() || userId == null || userId.trim().isEmpty()) {
            logger.error("Invalid parameters: templateId or userId is null/empty");
            throw new IllegalArgumentException("templateId and userId are required");
        }

        try {
            repository.delete(templateId, userId);
            logger.info("Deleted template: templateId={}, userId={}", templateId, userId);
        } catch (Exception e) {
            logger.error("Error deleting template: templateId={}, userId={}", templateId, userId, e);
            throw new RuntimeException("Failed to delete template: " + e.getMessage());
        }
    }

    public int deleteByTemplateId(String templateId) {
        if (templateId == null || templateId.trim().isEmpty()) {
            logger.error("Invalid templateId: null or empty");
            throw new IllegalArgumentException("templateId is required");
        }

        try {
            List<Template> templates = repository.findByTemplateId(templateId);
            if (templates.isEmpty()) {
                logger.info("No templates found for templateId: {}", templateId);
                return 0;
            }

            List<List<Template>> chunks = partitionList(templates);
            chunks.forEach(repository::batchDelete);
            logger.info("Deleted {} templates for templateId: {}", templates.size(), templateId);
            return templates.size();
        } catch (Exception e) {
            logger.error("Failed to delete templates for templateId: {}", templateId, e);
            throw new RuntimeException("Delete operation failed: " + e.getMessage());
        }
    }

    public List<Template> batchSave(List<Template> items) {
        try {
            List<List<Template>> chunks = partitionList(items);
            chunks.forEach(repository::batchSave);
            logger.info("Successfully saved {} templates in batches", items.size());
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