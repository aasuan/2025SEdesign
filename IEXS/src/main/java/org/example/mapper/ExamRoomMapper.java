package org.example.mapper;

import org.example.entity.ExamRoom;

import java.util.List;

public interface ExamRoomMapper {
    ExamRoom selectById(Integer id);
    ExamRoom selectByExamAndStudent(Integer examId, Integer studentId);
    List<ExamRoom> selectByExamId(Integer examId);
    List<ExamRoom> selectByStudentId(Integer studentId);
    int insert(ExamRoom examRoom);
    int update(ExamRoom examRoom);
}

