package fun.fest2.templates;

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
public class TemplateEndpoint {

    private static final Logger logger = LoggerFactory.getLogger(TemplateEndpoint.class);
    private final TemplateService templateService;

    @Autowired
    public TemplateEndpoint(TemplateService templateService) {
        this.templateService = templateService;
    }

    public List<Map<String, Object>> getAllTemplates() {
        try {
            List<Template> allItems = templateService.findAll();
            if (allItems.isEmpty()) {
                logger.info("No templates found in DynamoDB");
                return new ArrayList<>();
            }

            // Group by templateId
            Map<String, Map<String, Object>> templatesById = new HashMap<>();
            for (Template item : allItems) {
                Map<String, Object> template = templatesById.computeIfAbsent(item.getTemplateId(), k -> {
                    Map<String, Object> newTemplate = new HashMap<>();
                    newTemplate.put("templateId", k);
                    return newTemplate;
                });

                // Add userId data
                Map<String, Object> userData = new HashMap<>();
                if (item.getData() != null) {
                    userData.putAll(item.getData());
                }
                template.put(item.getTemplateId(), userData);
            }

            logger.info("Retrieved {} templates from DynamoDB", templatesById.size());
            return new ArrayList<>(templatesById.values());
        } catch (Exception e) {
            logger.error("Failed to retrieve all templates", e);
            throw new RuntimeException("Error retrieving templates: " + e.getMessage());
        }
    }

    public Template getTemplateByIdAndUserId(String templateId, String userId) {
        try {
            Template item = templateService.findByTemplateIdAndUserId(templateId, userId);
            if (item != null) {
                logger.info("Retrieved Template for templateId={}, userId={}", templateId, userId);
                return item;
            } else {
                logger.info("No Template found for templateId={}, userId={}", templateId, userId);
                return null;
            }
        } catch (Exception e) {
            logger.error("Failed to retrieve Template for templateId={}, userId={}", templateId, userId, e);
            throw new RuntimeException("Error retrieving Template: " + e.getMessage());
        }
    }

    public Map<String, Object> getTemplateById(String templateId) {
        List<Template> items = templateService.findByTemplateId(templateId);
        if (items.isEmpty()) {
            logger.info("No data found for templateId={}", templateId);
            return null;
        }

        Map<String, Object> template = new HashMap<>();
        template.put("templateId", templateId);

        for (Template item : items) {
            Map<String, Object> userData = new HashMap<>();
            if (item.getData() != null) {
                userData.putAll(item.getData());
            }
            template.put(item.getTemplateId(), userData);
        }

        return template;
    }

    public void saveTemplate(Map<String, Object> payload) {
        String templateId = (String) payload.get("templateId");
        String userId = (String) payload.get("userId");
        Template item = new Template(templateId, userId);

        Map<String, Object> data = new HashMap<>(payload);
        data.remove("templateId");
        data.remove("userId");

        if (!data.isEmpty()) {
            item.setData(data);
        }

        templateService.save(item);
    }
}