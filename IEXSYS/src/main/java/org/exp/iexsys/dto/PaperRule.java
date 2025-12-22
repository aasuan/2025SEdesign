package org.exp.iexsys.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public class PaperRule {
    @NotBlank(message = "题型不能为空")
    private String questionType;
    @Min(value = 1, message = "题目数量至少为1")
    private int count;
    /** 每题分值，可选；未填则使用题目默认分值 */
    private BigDecimal scorePerQuestion;

    public String getQuestionType() {
        return questionType;
    }

    public void setQuestionType(String questionType) {
        this.questionType = questionType;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public BigDecimal getScorePerQuestion() {
        return scorePerQuestion;
    }

    public void setScorePerQuestion(BigDecimal scorePerQuestion) {
        this.scorePerQuestion = scorePerQuestion;
    }
}
