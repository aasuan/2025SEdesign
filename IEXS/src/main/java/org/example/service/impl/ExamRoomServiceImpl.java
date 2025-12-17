package org.example.service.impl;

import org.example.entity.*;
import org.example.mapper.*;
import org.example.service.ExamRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExamRoomServiceImpl implements ExamRoomService {

    @Autowired
    private ExamRoomMapper examRoomMapper;

    @Autowired
    private ExamRecordMapper examRecordMapper;

    @Autowired
    private ExamMapper examMapper;

    @Autowired
    private ExamQuestionMapper examQuestionMapper;

    @Autowired
    private QuestionMapper questionMapper;

    @Override
    public ExamRoom joinExam(Integer examId, Integer studentId) {
        // 检查是否已经参加
        ExamRoom existRoom = examRoomMapper.selectByExamAndStudent(examId, studentId);
        if (existRoom != null) {
            return existRoom;
        }
        // 创建考场
        ExamRoom examRoom = new ExamRoom();
        examRoom.setExamId(examId);
        examRoom.setStudentId(studentId);
        examRoom.setStatus(0); // 未开始
        examRoomMapper.insert(examRoom);
        return examRoom;
    }

    @Override
    public boolean startExam(Integer examRoomId) {
        ExamRoom examRoom = examRoomMapper.selectById(examRoomId);
        if (examRoom == null || examRoom.getStatus() != 0) {
            return false;
        }
        examRoom.setStatus(1); // 答题中
        examRoom.setStartTime(new Date());
        return examRoomMapper.update(examRoom) > 0;
    }

    @Override
    public boolean submitAnswer(Integer examRoomId, Integer questionId, String answer) {
        // 查询或创建答题记录
        ExamRecord record = examRecordMapper.selectByExamRoomAndQuestion(examRoomId, questionId);
        if (record == null) {
            record = new ExamRecord();
            record.setExamRoomId(examRoomId);
            record.setQuestionId(questionId);
            record.setStudentAnswer(answer);
            examRecordMapper.insert(record);
        } else {
            record.setStudentAnswer(answer);
            examRecordMapper.update(record);
        }
        return true;
    }

    @Override
    public boolean submitExam(Integer examRoomId) {
        ExamRoom examRoom = examRoomMapper.selectById(examRoomId);
        if (examRoom == null || examRoom.getStatus() == 2) {
            return false;
        }
        
        // 计算总分
        List<ExamRecord> records = examRecordMapper.selectByExamRoomId(examRoomId);
        int totalScore = 0;
        for (ExamRecord record : records) {
            Question question = questionMapper.selectById(record.getQuestionId());
            if (question != null && question.getCorrectAnswer().equals(record.getStudentAnswer())) {
                record.setScore(question.getScore());
                totalScore += question.getScore();
            } else {
                record.setScore(0);
            }
            examRecordMapper.update(record);
        }
        
        examRoom.setStatus(2); // 已交卷
        examRoom.setSubmitTime(new Date());
        examRoom.setScore(totalScore);
        return examRoomMapper.update(examRoom) > 0;
    }

    @Override
    public ExamRoom getExamRoomById(Integer id) {
        return examRoomMapper.selectById(id);
    }

    @Override
    public ExamRoom getExamRoomByExamAndStudent(Integer examId, Integer studentId) {
        return examRoomMapper.selectByExamAndStudent(examId, studentId);
    }

    @Override
    public List<ExamRoom> getExamRoomsByStudentId(Integer studentId) {
        return examRoomMapper.selectByStudentId(studentId);
    }

    @Override
    public List<Question> getExamQuestions(Integer examRoomId) {
        ExamRoom examRoom = examRoomMapper.selectById(examRoomId);
        if (examRoom == null) {
            return null;
        }
        List<Integer> questionIds = examQuestionMapper.selectQuestionIdsByExamId(examRoom.getExamId());
        List<Question> questions = questionIds.stream()
                .map(questionMapper::selectById)
                .collect(Collectors.toList());
        // 清除正确答案
        questions.forEach(q -> {
            q.setCorrectAnswer(null);
            q.setAnalysis(null);
        });
        return questions;
    }
}

