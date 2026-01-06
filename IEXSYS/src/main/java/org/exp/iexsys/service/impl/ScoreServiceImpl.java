package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.ScoreRecord;
import org.exp.iexsys.domain.Exam;
import org.exp.iexsys.domain.Paper;
import org.exp.iexsys.domain.PaperQuestion;
import org.exp.iexsys.domain.Question;
import org.exp.iexsys.domain.StudentAnswer;
import org.exp.iexsys.mapper.ExamMapper;
import org.exp.iexsys.mapper.PaperMapper;
import org.exp.iexsys.mapper.PaperQuestionMapper;
import org.exp.iexsys.mapper.QuestionMapper;
import org.exp.iexsys.mapper.ScoreRecordMapper;
import org.exp.iexsys.mapper.StudentAnswerMapper;
import org.exp.iexsys.service.ScoreService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ScoreServiceImpl implements ScoreService {

    private final ScoreRecordMapper scoreRecordMapper;
    private final ExamMapper examMapper;
    private final PaperMapper paperMapper;
    private final PaperQuestionMapper paperQuestionMapper;
    private final QuestionMapper questionMapper;
    private final StudentAnswerMapper studentAnswerMapper;

    public ScoreServiceImpl(ScoreRecordMapper scoreRecordMapper,
                            ExamMapper examMapper,
                            PaperMapper paperMapper,
                            PaperQuestionMapper paperQuestionMapper,
                            QuestionMapper questionMapper,
                            StudentAnswerMapper studentAnswerMapper) {
        this.scoreRecordMapper = scoreRecordMapper;
        this.examMapper = examMapper;
        this.paperMapper = paperMapper;
        this.paperQuestionMapper = paperQuestionMapper;
        this.questionMapper = questionMapper;
        this.studentAnswerMapper = studentAnswerMapper;
    }

    @Override
    public List<ScoreRecord> listByStudent(Long studentId) {
        return scoreRecordMapper.listByStudent(studentId);
    }

    @Override
    public Map<String, Object> summary(Long studentId) {
        Map<String, Object> map = scoreRecordMapper.summaryByStudent(studentId, 60);
        if (map == null) {
            map = new HashMap<>();
            map.put("totalExams", 0);
            map.put("avgScore", 0);
            map.put("maxScore", 0);
            map.put("passedExams", 0);
        }
        return map;
    }

    @Override
    public Map<String, Object> examDetail(Long examId, Long studentId) {
        Exam exam = examMapper.selectById(examId);
        if (exam == null) {
            return null;
        }
        ScoreRecord record = scoreRecordMapper.selectOne(examId, studentId);
        List<StudentAnswer> answers = studentAnswerMapper.listWithQuestion(examId, studentId);
        Paper paper = paperMapper.selectById(exam.getPaperId());
        List<PaperQuestion> items = paperQuestionMapper.selectByPaperId(exam.getPaperId());

        // fetch question details
        Set<Long> qIds = items.stream().map(PaperQuestion::getQuestionId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (!qIds.isEmpty()) {
            Map<Long, Question> questionMap = questionMapper.selectByIds(qIds.stream().toList())
                    .stream().collect(Collectors.toMap(Question::getQuestionId, q -> q));
            items.forEach(pq -> pq.setQuestion(questionMap.get(pq.getQuestionId())));
        }
        if (paper != null) {
            paper.setQuestions(items);
            paper.setItems(items);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("exam", exam);
        payload.put("paper", paper);
        payload.put("answers", answers);
        payload.put("scoreRecord", record);
        return payload;
    }

    @Override
    public Map<String, Object> examScores(Long examId) {
        Exam exam = examMapper.selectById(examId);
        if (exam == null) {
            throw new IllegalArgumentException("Exam not found");
        }
        List<ScoreRecord> list = scoreRecordMapper.listByExam(examId);
        Map<String, Object> summary = scoreRecordMapper.summaryByExam(examId, 60);
        if (summary == null) {
            summary = new HashMap<>();
            summary.put("totalStudents", 0);
            summary.put("avgScore", 0);
            summary.put("maxScore", 0);
            summary.put("minScore", 0);
            summary.put("passCount", 0);
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("records", list);
        payload.put("summary", summary);
        return payload;
    }
}
