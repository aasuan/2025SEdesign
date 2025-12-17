package org.example.mapper;

import org.example.entity.Exam;

import java.util.List;

public interface ExamMapper {
    Exam selectById(Integer id);
    List<Exam> selectAll();
    List<Exam> selectByCreatorId(Integer creatorId);
    List<Exam> selectAvailableExams(); // 查询可参加的考试
    int insert(Exam exam);
    int update(Exam exam);
    int delete(Integer id);
}

