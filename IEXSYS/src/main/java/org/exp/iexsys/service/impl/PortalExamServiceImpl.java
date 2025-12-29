package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.Exam;
import org.exp.iexsys.domain.ExamParticipant;
import org.exp.iexsys.domain.PaperQuestion;
import org.exp.iexsys.domain.Question;
import org.exp.iexsys.domain.StudentAnswer;
import org.exp.iexsys.dto.PortalAnswerSaveRequest;
import org.exp.iexsys.dto.PortalEventRequest;
import org.exp.iexsys.mapper.ExamMapper;
import org.exp.iexsys.mapper.ExamParticipantMapper;
import org.exp.iexsys.mapper.PaperQuestionMapper;
import org.exp.iexsys.mapper.QuestionMapper;
import org.exp.iexsys.mapper.StudentAnswerMapper;
import org.exp.iexsys.service.PortalExamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class PortalExamServiceImpl implements PortalExamService {

    private static final Logger log = LoggerFactory.getLogger(PortalExamServiceImpl.class);

    private final ExamMapper examMapper;
    private final ExamParticipantMapper examParticipantMapper;
    private final StudentAnswerMapper studentAnswerMapper;
    private final PaperQuestionMapper paperQuestionMapper;
    private final QuestionMapper questionMapper;

    public PortalExamServiceImpl(ExamMapper examMapper,
                                 ExamParticipantMapper examParticipantMapper,
                                 StudentAnswerMapper studentAnswerMapper,
                                 PaperQuestionMapper paperQuestionMapper,
                                 QuestionMapper questionMapper) {
        this.examMapper = examMapper;
        this.examParticipantMapper = examParticipantMapper;
        this.studentAnswerMapper = studentAnswerMapper;
        this.paperQuestionMapper = paperQuestionMapper;
        this.questionMapper = questionMapper;
    }

    @Override
    public List<Map<String, Object>> listAvailable(Long studentId) {
        List<ExamParticipant> records = examParticipantMapper.listByStudentId(studentId);
        if (CollectionUtils.isEmpty(records)) {
            return Collections.emptyList();
        }
        List<Long> examIds = records.stream()
                .map(ExamParticipant::getExamId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (CollectionUtils.isEmpty(examIds)) {
            return Collections.emptyList();
        }
        List<Exam> exams = examMapper.selectByIds(examIds);
        Map<Long, Exam> examMap = exams.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Exam::getExamId, Function.identity()));
        List<Map<String, Object>> result = new ArrayList<>();
        for (ExamParticipant participant : records) {
            Exam exam = examMap.get(participant.getExamId());
            if (exam == null || "Canceled".equalsIgnoreCase(exam.getStatus())) {
                continue;
            }
            Map<String, Object> row = new HashMap<>();
            row.put("exam", exam);
            row.put("participant", participant);
            result.add(row);
        }
        return result;
    }

    @Override
    public Map<String, Object> enter(Long examId, Long studentId) {
        Exam exam = mustFindExam(examId);
        ExamParticipant participant = ensureParticipant(examId, studentId);
        if ("Canceled".equalsIgnoreCase(exam.getStatus())) {
            throw new IllegalArgumentException("Exam has been canceled");
        }
        validateWindow(exam);
        examParticipantMapper.updateStatus(examId, studentId, "Joined");
        examParticipantMapper.touchHeartbeat(examId, studentId);
        ExamParticipant refreshed = examParticipantMapper.selectOne(examId, studentId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("exam", exam);
        payload.put("participant", refreshed);
        return payload;
    }

    @Override
    public void heartbeat(Long examId, Long studentId) {
        mustFindExam(examId);
        ensureParticipant(examId, studentId);
        examParticipantMapper.touchHeartbeat(examId, studentId);
    }

    @Override
    public void recordEvent(Long examId, Long studentId, PortalEventRequest request) {
        mustFindExam(examId);
        ensureParticipant(examId, studentId);
        log.info("Exam event: examId={}, studentId={}, type={}, detail={}, occurredAt={}",
                examId, studentId, request.getEventType(), request.getDetail(), request.getOccurredAt());
    }

    @Override
    public List<Map<String, Object>> listQuestions(Long examId, Long studentId) {
        Exam exam = mustFindExam(examId);
        ensureParticipant(examId, studentId);
        List<PaperQuestion> items = paperQuestionMapper.selectByPaperId(exam.getPaperId());
        if (CollectionUtils.isEmpty(items)) {
            return Collections.emptyList();
        }
        List<Long> questionIds = items.stream()
                .map(PaperQuestion::getQuestionId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (CollectionUtils.isEmpty(questionIds)) {
            return Collections.emptyList();
        }
        Map<Long, Question> questionMap = questionMapper.selectByIds(questionIds)
                .stream()
                .collect(Collectors.toMap(Question::getQuestionId, Function.identity()));
        Map<Long, StudentAnswer> answerMap = studentAnswerMapper.listByExamAndStudent(examId, studentId)
                .stream()
                .collect(Collectors.toMap(StudentAnswer::getQuestionId, Function.identity(), (a, b) -> a));
        List<Map<String, Object>> result = new ArrayList<>();
        for (PaperQuestion pq : items) {
            Question q = questionMap.get(pq.getQuestionId());
            StudentAnswer ans = answerMap.get(pq.getQuestionId());
            Map<String, Object> row = new HashMap<>();
            row.put("questionId", pq.getQuestionId());
            row.put("sequenceNum", pq.getSequenceNum());
            row.put("questionScore", pq.getQuestionScore());
            if (q != null) {
                row.put("questionType", q.getQuestionType());
                row.put("difficulty", q.getDifficulty());
                row.put("content", q.getContent());
                row.put("options", q.getOptions());
            }
            if (ans != null) {
                row.put("answered", ans.getStudentResponse() != null);
                row.put("studentResponse", ans.getStudentResponse());
                row.put("saveTime", ans.getSaveTime());
            } else {
                row.put("answered", false);
            }
            result.add(row);
        }
        return result;
    }

    @Override
    public StudentAnswer saveAnswer(Long examId, Long studentId, PortalAnswerSaveRequest request) {
        Exam exam = mustFindExam(examId);
        ExamParticipant participant = ensureParticipant(examId, studentId);
        if ("Submitted".equalsIgnoreCase(participant.getJoinStatus())) {
            throw new IllegalArgumentException("Exam already submitted");
        }
        validateWindow(exam);
        ensureQuestionBelongs(exam, request.getQuestionId());
        StudentAnswer answer = new StudentAnswer();
        answer.setExamId(examId);
        answer.setStudentId(studentId);
        answer.setQuestionId(request.getQuestionId());
        answer.setStudentResponse(request.getStudentResponse());
        answer.setGraded(Boolean.FALSE);
        answer.setSaveTime(request.getSaveTime() != null ? request.getSaveTime() : LocalDateTime.now());
        studentAnswerMapper.upsert(answer);
        return studentAnswerMapper.selectOne(examId, studentId, request.getQuestionId());
    }

    @Override
    public void submit(Long examId, Long studentId) {
        Exam exam = mustFindExam(examId);
        ensureParticipant(examId, studentId);
        if ("Canceled".equalsIgnoreCase(exam.getStatus())) {
            throw new IllegalArgumentException("Exam has been canceled");
        }
        examParticipantMapper.markSubmitted(examId, studentId);
    }

    private Exam mustFindExam(Long examId) {
        Exam exam = examMapper.selectById(examId);
        if (exam == null) {
            throw new IllegalArgumentException("Exam not found");
        }
        return exam;
    }

    private ExamParticipant ensureParticipant(Long examId, Long studentId) {
        ExamParticipant participant = examParticipantMapper.selectOne(examId, studentId);
        if (participant != null) {
            return participant;
        }
        examParticipantMapper.insertBatch(examId, Collections.singletonList(studentId));
        return examParticipantMapper.selectOne(examId, studentId);
    }

    private void validateWindow(Exam exam) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = exam.getStartTime();
        LocalDateTime end = effectiveEnd(exam);
        if (start != null && now.isBefore(start)) {
            throw new IllegalArgumentException("Exam has not started");
        }
        if (end != null && now.isAfter(end)) {
            throw new IllegalArgumentException("Exam already ended");
        }
    }

    private LocalDateTime effectiveEnd(Exam exam) {
        if (exam.getEndTime() != null) {
            return exam.getEndTime();
        }
        if (exam.getStartTime() != null && exam.getDurationMinutes() != null) {
            return exam.getStartTime().plusMinutes(exam.getDurationMinutes());
        }
        return null;
    }

    private void ensureQuestionBelongs(Exam exam, Long questionId) {
        List<PaperQuestion> items = paperQuestionMapper.selectByPaperId(exam.getPaperId());
        if (CollectionUtils.isEmpty(items)) {
            throw new IllegalArgumentException("No questions configured for this exam");
        }
        Set<Long> questionIds = items.stream()
                .map(PaperQuestion::getQuestionId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (!questionIds.contains(questionId)) {
            throw new IllegalArgumentException("Question does not belong to this exam");
        }
    }
}
