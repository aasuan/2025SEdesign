package org.exp.iexsys.dto;

/**
 * 简单的题目-标签视图对象，用于聚合题目标签信息
 */
public class QuestionTagView {
    private Long questionId;
    private Integer tagId;
    private String tagName;

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public Integer getTagId() {
        return tagId;
    }

    public void setTagId(Integer tagId) {
        this.tagId = tagId;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
    }
}
