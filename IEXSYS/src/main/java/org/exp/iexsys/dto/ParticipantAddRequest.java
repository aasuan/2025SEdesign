package org.exp.iexsys.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class ParticipantAddRequest {
    @NotEmpty
    private List<Long> studentIds;

    public List<Long> getStudentIds() {
        return studentIds;
    }

    public void setStudentIds(List<Long> studentIds) {
        this.studentIds = studentIds;
    }
}
