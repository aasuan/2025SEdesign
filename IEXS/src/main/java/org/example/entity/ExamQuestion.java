package org.example.entity;

import java.io.Serializable;

/**
 * 考试题目关联实体类（考试与题目的关联表）
 */
public class ExamQuestion implements Serializable {
    private Integer id;
    private Integer examId; // 考试ID
    private Integer questionId; // 题目ID
    private Integer orderNum; // 题目顺序

    public ExamQuestion() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getExamId() {
        return examId;
    }

    public void setExamId(Integer examId) {
        this.examId = examId;
    }

    public Integer getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Integer questionId) {
        this.questionId = questionId;
    }

    public Integer getOrderNum() {
        return orderNum;
    }

    public void setOrderNum(Integer orderNum) {
        this.orderNum = orderNum;
    }
}

