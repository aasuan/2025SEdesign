package org.example.service;

import org.example.entity.Exam;
import org.example.entity.ExamQuestion;

import java.util.List;

public interface ExamService {
    /**
     * 创建考试
     */
    boolean createExam(Exam exam, List<Integer> questionIds);

    /**
     * 根据ID查询考试
     */
    Exam getExamById(Integer id);

    /**
     * 查询所有考试
     */
    List<Exam> getAllExams();

    /**
     * 查询可参加的考试
     */
    List<Exam> getAvailableExams();

    /**
     * 根据创建者ID查询考试
     */
    List<Exam> getExamsByCreatorId(Integer creatorId);

    /**
     * 获取考试的题目列表
     */
    List<Integer> getExamQuestionIds(Integer examId);

    /**
     * 更新考试
     */
    boolean updateExam(Exam exam);
}

