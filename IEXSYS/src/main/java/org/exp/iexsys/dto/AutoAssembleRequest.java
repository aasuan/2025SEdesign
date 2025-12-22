package org.exp.iexsys.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class AutoAssembleRequest {
    @NotEmpty(message = "组卷规则不能为空")
    @Valid
    private List<PaperRule> rules;

    public List<PaperRule> getRules() {
        return rules;
    }

    public void setRules(List<PaperRule> rules) {
        this.rules = rules;
    }
}
