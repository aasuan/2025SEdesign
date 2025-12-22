package org.exp.iexsys.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class PaperQuestionItemDto {
    @NotNull(message = "题目ID不能为空")
    private Long questionId;
    @NotNull(message = "题目分值不能为空")
    private BigDecimal questionScore;
    @Min(value = 1, message = "题目序号必须大于等于1")
    private int sequenceNum;

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public BigDecimal getQuestionScore() {
        return questionScore;
    }

    public void setQuestionScore(BigDecimal questionScore) {
        this.questionScore = questionScore;
    }

    public int getSequenceNum() {
        return sequenceNum;
    }

    public void setSequenceNum(int sequenceNum) {
        this.sequenceNum = sequenceNum;
    }
}
