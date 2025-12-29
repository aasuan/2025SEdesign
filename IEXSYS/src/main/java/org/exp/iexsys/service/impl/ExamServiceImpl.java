package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.Exam;
import org.exp.iexsys.domain.ExamParticipant;
import org.exp.iexsys.domain.Paper;
import org.exp.iexsys.mapper.ExamMapper;
import org.exp.iexsys.mapper.ExamParticipantMapper;
import org.exp.iexsys.mapper.PaperMapper;
import org.exp.iexsys.service.ExamService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ExamServiceImpl implements ExamService {

    private final ExamMapper examMapper;
    private final PaperMapper paperMapper;
    private final ExamParticipantMapper examParticipantMapper;

    public ExamServiceImpl(ExamMapper examMapper, PaperMapper paperMapper, ExamParticipantMapper examParticipantMapper) {
        this.examMapper = examMapper;
        this.paperMapper = paperMapper;
        this.examParticipantMapper = examParticipantMapper;
    }

    @Override
    public List<Exam> list(String status, LocalDateTime startFrom, LocalDateTime startTo) {
        return examMapper.list(status, startFrom, startTo);
    }

    @Override
    public Exam create(Exam exam) {
        ensurePaperExists(exam.getPaperId());
        normalizeTime(exam);
        if (exam.getStatus() == null || exam.getStatus().isEmpty()) {
            exam.setStatus("Pending");
        }
        examMapper.insert(exam);
        return examMapper.selectById(exam.getExamId());
    }

    @Override
    public Exam update(Long id, Exam exam) {
        ensurePaperExists(exam.getPaperId());
        Exam existing = examMapper.selectById(id);
        if (existing == null) {
            throw new IllegalArgumentException("Exam not found");
        }
        normalizeTime(exam);
        if (exam.getStatus() == null || exam.getStatus().isEmpty()) {
            exam.setStatus(existing.getStatus());
        }
        exam.setExamId(id);
        examMapper.update(exam);
        return examMapper.selectById(id);
    }

    @Override
    public Exam findById(Long id) {
        return examMapper.selectById(id);
    }

    @Override
    public Exam publish(Long id) {
        requireExam(id);
        examMapper.updateStatus(id, "Active");
        return examMapper.selectById(id);
    }

    @Override
    public Exam cancel(Long id) {
        requireExam(id);
        examMapper.updateStatus(id, "Canceled");
        return examMapper.selectById(id);
    }

    @Override
    public List<ExamParticipant> listParticipants(Long examId) {
        requireExam(examId);
        return examParticipantMapper.listByExamId(examId);
    }

    @Override
    public void addParticipants(Long examId, List<Long> studentIds) {
        requireExam(examId);
        if (CollectionUtils.isEmpty(studentIds)) {
            throw new IllegalArgumentException("studentIds cannot be empty");
        }
        examParticipantMapper.insertBatch(examId, studentIds);
    }

    private void ensurePaperExists(Long paperId) {
        Paper paper = paperMapper.selectById(paperId);
        if (paper == null) {
            throw new IllegalArgumentException("Paper not found");
        }
    }

    private void requireExam(Long examId) {
        Exam exam = examMapper.selectById(examId);
        if (exam == null) {
            throw new IllegalArgumentException("Exam not found");
        }
    }

    private void normalizeTime(Exam exam) {
        if (exam.getEndTime() == null && exam.getStartTime() != null && exam.getDurationMinutes() != null) {
            exam.setEndTime(exam.getStartTime().plusMinutes(exam.getDurationMinutes()));
        }
        if (exam.getStartTime() != null && exam.getEndTime() != null && exam.getStartTime().isAfter(exam.getEndTime())) {
            throw new IllegalArgumentException("startTime cannot be after endTime");
        }
    }
}
