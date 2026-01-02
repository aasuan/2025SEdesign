package org.exp.iexsys.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.Exam;
import org.exp.iexsys.domain.StudentAnswer;
import org.exp.iexsys.dto.UserProfile;
import org.exp.iexsys.mapper.ExamMapper;
import org.exp.iexsys.mapper.StudentAnswerMapper;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/grading")
public class GradingController {

    private static final String SESSION_KEY = "LOGIN_USER";

    private final StudentAnswerMapper studentAnswerMapper;
    private final ExamMapper examMapper;

    public GradingController(StudentAnswerMapper studentAnswerMapper, ExamMapper examMapper) {
        this.studentAnswerMapper = studentAnswerMapper;
        this.examMapper = examMapper;
    }

    @GetMapping("/ungraded")
    public ApiResponse<List<StudentAnswer>> listUngraded(@RequestParam(value = "examId", required = false) Long examId) {
        return ApiResponse.success(studentAnswerMapper.listUngraded(examId));
    }

    @PostMapping("/answers/{id}/grade")
    public ApiResponse<Void> grade(@PathVariable("id") Long answerId,
                                   @Valid @RequestBody GradeRequest request,
                                   HttpSession session) {
        Long graderId = currentUserId(session);
        int updated = studentAnswerMapper.grade(answerId, BigDecimal.valueOf(request.getScore()), graderId, request.getComment());
        if (updated <= 0) {
            return ApiResponse.failure(404, "答卷不存在");
        }
        // 如果该考试所有答卷都已批改，更新考试状态为 Finished
        Exam exam = examMapper.selectById(request.getExamId());
        if (exam != null) {
            int remain = studentAnswerMapper.countUngradedByExam(exam.getExamId());
            if (remain == 0) {
                examMapper.updateStatus(exam.getExamId(), "Finished");
            }
        }
        return ApiResponse.success("graded");
    }

    private Long currentUserId(HttpSession session) {
        Object obj = session.getAttribute(SESSION_KEY);
        if (obj instanceof UserProfile) {
            return ((UserProfile) obj).getId();
        }
        return null;
    }

    public static class GradeRequest {
        @NotNull
        private Long examId;
        @NotNull
        private Double score;
        private String comment;

        public Long getExamId() {
            return examId;
        }

        public void setExamId(Long examId) {
            this.examId = examId;
        }

        public Double getScore() {
            return score;
        }

        public void setScore(Double score) {
            this.score = score;
        }

        public String getComment() {
            return comment;
        }

        public void setComment(String comment) {
            this.comment = comment;
        }
    }
}

