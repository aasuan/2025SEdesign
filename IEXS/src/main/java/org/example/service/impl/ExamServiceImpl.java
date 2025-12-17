package org.example.service.impl;

import org.example.entity.Exam;
import org.example.entity.ExamQuestion;
import org.example.mapper.ExamMapper;
import org.example.mapper.ExamQuestionMapper;
import org.example.service.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ExamServiceImpl implements ExamService {

    @Autowired
    private ExamMapper examMapper;

    @Autowired
    private ExamQuestionMapper examQuestionMapper;

    @Override
    public boolean createExam(Exam exam, List<Integer> questionIds) {
        // 插入考试
        int result = examMapper.insert(exam);
        if (result > 0 && questionIds != null && !questionIds.isEmpty()) {
            // 插入考试题目关联
            for (int i = 0; i < questionIds.size(); i++) {
                ExamQuestion eq = new ExamQuestion();
                eq.setExamId(exam.getId());
                eq.setQuestionId(questionIds.get(i));
                eq.setOrderNum(i + 1);
                examQuestionMapper.insert(eq);
            }
            return true;
        }
        return result > 0;
    }

    @Override
    public Exam getExamById(Integer id) {
        return examMapper.selectById(id);
    }

    @Override
    public List<Exam> getAllExams() {
        return examMapper.selectAll();
    }

    @Override
    public List<Exam> getAvailableExams() {
        return examMapper.selectAvailableExams();
    }

    @Override
    public List<Exam> getExamsByCreatorId(Integer creatorId) {
        return examMapper.selectByCreatorId(creatorId);
    }

    @Override
    public List<Integer> getExamQuestionIds(Integer examId) {
        return examQuestionMapper.selectQuestionIdsByExamId(examId);
    }

    @Override
    public boolean updateExam(Exam exam) {
        return examMapper.update(exam) > 0;
    }
}

