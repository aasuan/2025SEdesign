package org.exp.iexsys.domain;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 试卷-试题关联。
 */
public class PaperQuestion implements Serializable {
    private Long pqId;
    private Long paperId;
    private Long questionId;
    private BigDecimal questionScore;
    private Integer sequenceNum;

    public Long getPqId() {
        return pqId;
    }

    public void setPqId(Long pqId) {
        this.pqId = pqId;
    }

    public Long getPaperId() {
        return paperId;
    }

    public void setPaperId(Long paperId) {
        this.paperId = paperId;
    }

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

    public Integer getSequenceNum() {
        return sequenceNum;
    }

    public void setSequenceNum(Integer sequenceNum) {
        this.sequenceNum = sequenceNum;
    }
}
