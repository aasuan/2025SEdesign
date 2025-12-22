package org.exp.iexsys.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class PaperCreateRequest {
    @NotBlank(message = "试卷名称不能为空")
    private String paperName;

    @NotNull(message = "创建者不能为空")
    private Long creatorId;

    /** 是否草稿，默认 true */
    private Boolean draft = true;

    @NotEmpty(message = "组卷规则不能为空")
    @Valid
    private List<PaperRule> rules;

    public String getPaperName() {
        return paperName;
    }

    public void setPaperName(String paperName) {
        this.paperName = paperName;
    }

    public Long getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(Long creatorId) {
        this.creatorId = creatorId;
    }

    public Boolean getDraft() {
        return draft;
    }

    public void setDraft(Boolean draft) {
        this.draft = draft;
    }

    public List<PaperRule> getRules() {
        return rules;
    }

    public void setRules(List<PaperRule> rules) {
        this.rules = rules;
    }
}
