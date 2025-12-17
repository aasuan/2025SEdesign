package org.example.entity;

import java.io.Serializable;
import java.util.Date;

/**
 * 考试记录实体类（学生答题记录）
 */
public class ExamRecord implements Serializable {
    private Integer id;
    private Integer examRoomId; // 考场ID
    private Integer questionId; // 题目ID
    private String studentAnswer; // 学生答案
    private Integer score; // 该题得分
    private Date answerTime; // 答题时间

    public ExamRecord() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getExamRoomId() {
        return examRoomId;
    }

    public void setExamRoomId(Integer examRoomId) {
        this.examRoomId = examRoomId;
    }

    public Integer getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Integer questionId) {
        this.questionId = questionId;
    }

    public String getStudentAnswer() {
        return studentAnswer;
    }

    public void setStudentAnswer(String studentAnswer) {
        this.studentAnswer = studentAnswer;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Date getAnswerTime() {
        return answerTime;
    }

    public void setAnswerTime(Date answerTime) {
        this.answerTime = answerTime;
    }
}

