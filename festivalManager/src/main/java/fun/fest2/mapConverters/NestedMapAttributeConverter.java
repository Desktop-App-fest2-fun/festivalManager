package fun.fest2.mapConverters;

import software.amazon.awssdk.enhanced.dynamodb.AttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.AttributeValueType;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

public class NestedMapAttributeConverter implements AttributeConverter<Map<String, Object>> {

    @Override
    public AttributeValue transformFrom(Map<String, Object> input) {
        if (input == null) {
            return AttributeValue.builder().nul(true).build();
        }

        Map<String, AttributeValue> result = new HashMap<>();
        for (Map.Entry<String, Object> entry : input.entrySet()) {
            result.put(entry.getKey(), toAttributeValue(entry.getValue()));
        }
        return AttributeValue.builder().m(result).build();
    }

    @Override
    public Map<String, Object> transformTo(AttributeValue attributeValue) {
        if (attributeValue == null || attributeValue.nul() != null) {
            return null;
        }

        if (attributeValue.m() == null) {
            throw new IllegalArgumentException("Expected Map attribute value");
        }

        Map<String, Object> result = new HashMap<>();
        attributeValue.m().forEach((key, value) -> {
            result.put(key, fromAttributeValue(value));
        });
        return result;
    }

    private AttributeValue toAttributeValue(Object value) {
        if (value == null) {
            return AttributeValue.builder().nul(true).build();
        }

        if (value instanceof String) {
            return AttributeValue.builder().s((String) value).build();
        } else if (value instanceof Number) {
            return AttributeValue.builder().n(value.toString()).build();
        } else if (value instanceof Boolean) {
            return AttributeValue.builder().bool((Boolean) value).build();
        } else if (value instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) value;
            return transformFrom(map);
        } else if (value instanceof List) {
            @SuppressWarnings("unchecked")
            List<Object> list = (List<Object>) value;
            return AttributeValue.builder().l(
                    list.stream()
                            .map(this::toAttributeValue)
                            .collect(Collectors.toList())
            ).build();
        }
        throw new IllegalArgumentException("Unsupported type: " + value.getClass());
    }

    private Object fromAttributeValue(AttributeValue value) {
        if (value == null || value.nul() != null) {
            return null;
        }

        if (value.s() != null) {
            return value.s();
        } else if (value.n() != null) {
            try {
                return Long.parseLong(value.n());
            } catch (NumberFormatException e) {
                return Double.parseDouble(value.n());
            }
        } else if (value.bool() != null) {
            return value.bool();
        } else if (value.m() != null) {
            // Handle nested maps
            Map<String, Object> map = new HashMap<>();
            value.m().forEach((key, nestedValue) -> {
                map.put(key, fromAttributeValue(nestedValue));
            });
            return map;
        } else if (value.l() != null) {
            // Handle lists (including nested lists)
            return value.l().stream()
                    .map(this::fromAttributeValue)
                    .collect(Collectors.toList());
        }
        throw new IllegalArgumentException("Unsupported AttributeValue type: " + value);
    }

    @Override
    public EnhancedType<Map<String, Object>> type() {
        return EnhancedType.mapOf(String.class, Object.class);
    }

    @Override
    public AttributeValueType attributeValueType() {
        return AttributeValueType.M;
    }
}