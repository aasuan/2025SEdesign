package org.example.mapper;

import org.example.entity.ExamQuestion;

import java.util.List;

public interface ExamQuestionMapper {
    List<ExamQuestion> selectByExamId(Integer examId);
    List<Integer> selectQuestionIdsByExamId(Integer examId);
    int insert(ExamQuestion examQuestion);
    int deleteByExamId(Integer examId);
}

