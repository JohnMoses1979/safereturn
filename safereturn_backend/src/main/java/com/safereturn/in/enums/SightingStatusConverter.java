package com.safereturn.in.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class SightingStatusConverter implements AttributeConverter<SightingStatus, String> {

    @Override
    public String convertToDatabaseColumn(SightingStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.name();
    }

    @Override
    public SightingStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        String val = dbData.trim();
        // Handle legacy camelCase database values gracefully
        if (val.equalsIgnoreCase("New") || val.equalsIgnoreCase("PENDING_VERIFICATION")) {
            return SightingStatus.PENDING_VERIFICATION;
        }
        if (val.equalsIgnoreCase("Under Review") || val.equalsIgnoreCase("UNDER_REVIEW")) {
            return SightingStatus.UNDER_REVIEW;
        }
        if (val.equalsIgnoreCase("Confirmed") || val.equalsIgnoreCase("CONFIRMED")) {
            return SightingStatus.CONFIRMED;
        }
        if (val.equalsIgnoreCase("Not Found") || val.equalsIgnoreCase("NOT_FOUND")) {
            return SightingStatus.NOT_FOUND;
        }
        try {
            return SightingStatus.valueOf(val.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            return SightingStatus.PENDING_VERIFICATION;
        }
    }
}
