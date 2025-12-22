package org.exp.iexsys.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class PaperAdjustRequest {
    @NotEmpty(message = "题目列表不能为空")
    @Valid
    private List<PaperQuestionItemDto> items;

    private Boolean draft;

    public List<PaperQuestionItemDto> getItems() {
        return items;
    }

    public void setItems(List<PaperQuestionItemDto> items) {
        this.items = items;
    }

    public Boolean getDraft() {
        return draft;
    }

    public void setDraft(Boolean draft) {
        this.draft = draft;
    }
}
