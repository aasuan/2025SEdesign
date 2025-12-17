package org.example.mapper;

import org.example.entity.ExamRecord;

import java.util.List;

public interface ExamRecordMapper {
    ExamRecord selectById(Integer id);
    List<ExamRecord> selectByExamRoomId(Integer examRoomId);
    ExamRecord selectByExamRoomAndQuestion(Integer examRoomId, Integer questionId);
    int insert(ExamRecord examRecord);
    int update(ExamRecord examRecord);
}

