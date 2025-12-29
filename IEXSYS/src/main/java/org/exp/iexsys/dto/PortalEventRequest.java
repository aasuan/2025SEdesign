package org.exp.iexsys.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class PortalEventRequest {
    @NotBlank
    private String eventType;
    private String detail;
    private LocalDateTime occurredAt;

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }
}
