package org.example.service;

import org.example.entity.ExamRoom;
import org.example.entity.Question;

import java.util.List;

public interface ExamRoomService {
    /**
     * 学生参加考试（创建考场）
     */
    ExamRoom joinExam(Integer examId, Integer studentId);

    /**
     * 开始答题
     */
    boolean startExam(Integer examRoomId);

    /**
     * 提交答案
     */
    boolean submitAnswer(Integer examRoomId, Integer questionId, String answer);

    /**
     * 交卷
     */
    boolean submitExam(Integer examRoomId);

    /**
     * 根据ID查询考场
     */
    ExamRoom getExamRoomById(Integer id);

    /**
     * 根据考试ID和学生ID查询考场
     */
    ExamRoom getExamRoomByExamAndStudent(Integer examId, Integer studentId);

    /**
     * 查询学生的所有考场
     */
    List<ExamRoom> getExamRoomsByStudentId(Integer studentId);

    /**
     * 获取考试题目列表（不包含答案）
     */
    List<Question> getExamQuestions(Integer examRoomId);
}

