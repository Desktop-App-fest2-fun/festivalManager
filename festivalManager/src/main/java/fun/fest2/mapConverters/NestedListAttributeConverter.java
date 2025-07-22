package fun.fest2.mapConverters;

import software.amazon.awssdk.enhanced.dynamodb.AttributeConverter;
import software.amazon.awssdk.enhanced.dynamodb.AttributeValueType;
import software.amazon.awssdk.enhanced.dynamodb.EnhancedType;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class NestedListAttributeConverter implements AttributeConverter<List<Map<String, Object>>> {

    @Override
    public AttributeValue transformFrom(List<Map<String, Object>> input) {
        if (input == null) {
            return AttributeValue.builder().nul(true).build();
        }

        return AttributeValue.builder().l(
                input.stream()
                        .map(this::convertMapToAttributeValue)
                        .collect(Collectors.toList())
        ).build();
    }

    @Override
    public List<Map<String, Object>> transformTo(AttributeValue attributeValue) {
        if (attributeValue == null || attributeValue.nul() != null) {
            return null;
        }

        return attributeValue.l().stream()
                .map(this::convertAttributeValueToMap)
                .collect(Collectors.toList());
    }

    private AttributeValue convertMapToAttributeValue(Map<String, Object> map) {
        return AttributeValue.builder().m(
                map.entrySet().stream()
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> convertObjectToAttributeValue(e.getValue())
                        ))
        ).build();
    }

    private Map<String, Object> convertAttributeValueToMap(AttributeValue attributeValue) {
        return attributeValue.m().entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> convertAttributeValueToObject(e.getValue())
                ));
    }

    private AttributeValue convertObjectToAttributeValue(Object value) {
        if (value == null) {
            return AttributeValue.builder().nul(true).build();
        } else if (value instanceof String) {
            return AttributeValue.builder().s((String) value).build();
        } else if (value instanceof Number) {
            return AttributeValue.builder().n(value.toString()).build();
        } else if (value instanceof Boolean) {
            return AttributeValue.builder().bool((Boolean) value).build();
        } else if (value instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) value;
            return convertMapToAttributeValue(map);
        } else if (value instanceof List) {
            @SuppressWarnings("unchecked")
            List<Object> list = (List<Object>) value;
            return AttributeValue.builder().l(
                    list.stream()
                            .map(this::convertObjectToAttributeValue)
                            .collect(Collectors.toList())
            ).build();
        }
        throw new IllegalArgumentException("Unsupported type: " + value.getClass());
    }

    private Object convertAttributeValueToObject(AttributeValue value) {
        if (value == null || value.nul() != null) {
            return null;
        } else if (value.s() != null) {
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
            return convertAttributeValueToMap(value);
        } else if (value.l() != null) {
            return value.l().stream()
                    .map(this::convertAttributeValueToObject)
                    .collect(Collectors.toList());
        }
        throw new IllegalArgumentException("Unsupported AttributeValue type: " + value);
    }

    @Override
    public EnhancedType<List<Map<String, Object>>> type() {
        return EnhancedType.listOf(EnhancedType.mapOf(String.class, Object.class));
    }

    @Override
    public AttributeValueType attributeValueType() {
        return AttributeValueType.L;
    }
}