package org.example.entity;

import java.io.Serializable;
import java.util.Date;

/**
 * 考场实体类（考试与学生的关联表）
 */
public class ExamRoom implements Serializable {
    private Integer id;
    private Integer examId; // 考试ID
    private Integer studentId; // 学生ID
    private Integer status; // 状态：0-未开始 1-答题中 2-已交卷
    private Date startTime; // 学生开始答题时间
    private Date submitTime; // 交卷时间
    private Integer score; // 得分
    private Date createTime;

    public ExamRoom() {
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

    public Integer getStudentId() {
        return studentId;
    }

    public void setStudentId(Integer studentId) {
        this.studentId = studentId;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Date getSubmitTime() {
        return submitTime;
    }

    public void setSubmitTime(Date submitTime) {
        this.submitTime = submitTime;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }
}

