package org.exp.iexsys.domain;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 试卷模板/实例。
 */
public class Paper implements Serializable {
    private Long paperId;
    private String paperName;
    private Long creatorId;
    private BigDecimal totalScore;
    private Boolean draft;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String extraInfo;
    private List<PaperQuestion> questions;
    private List<PaperQuestion> items;

    public Long getPaperId() {
        return paperId;
    }

    public void setPaperId(Long paperId) {
        this.paperId = paperId;
    }

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

    public BigDecimal getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(BigDecimal totalScore) {
        this.totalScore = totalScore;
    }

    public Boolean getDraft() {
        return draft;
    }

    public void setDraft(Boolean draft) {
        this.draft = draft;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getExtraInfo() {
        return extraInfo;
    }

    public void setExtraInfo(String extraInfo) {
        this.extraInfo = extraInfo;
    }

    public List<PaperQuestion> getQuestions() {
        return questions;
    }

    public void setQuestions(List<PaperQuestion> questions) {
        this.questions = questions;
    }

    public List<PaperQuestion> getItems() {
        return items;
    }

    public void setItems(List<PaperQuestion> items) {
        this.items = items;
    }
}
