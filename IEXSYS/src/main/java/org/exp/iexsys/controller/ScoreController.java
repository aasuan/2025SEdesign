package org.exp.iexsys.controller;

import jakarta.servlet.http.HttpSession;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.ScoreRecord;
import org.exp.iexsys.dto.UserProfile;
import org.exp.iexsys.service.ScoreService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scores")
public class ScoreController {

    private static final String SESSION_KEY = "LOGIN_USER";
    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> myScores(HttpSession session) {
        UserProfile user = (UserProfile) session.getAttribute(SESSION_KEY);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        List<ScoreRecord> list = scoreService.listByStudent(user.getId());
        Map<String, Object> summary = scoreService.summary(user.getId());
        Map<String, Object> payload = new HashMap<>();
        payload.put("records", list);
        payload.put("summary", summary);
        return ApiResponse.success(payload);
    }

    @GetMapping("/me/detail")
    public ApiResponse<Map<String, Object>> myExamDetail(Long examId, HttpSession session) {
        UserProfile user = (UserProfile) session.getAttribute(SESSION_KEY);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        Map<String, Object> detail = scoreService.examDetail(examId, user.getId());
        if (detail == null) {
            return ApiResponse.failure(404, "Exam not found");
        }
        return ApiResponse.success(detail);
    }

    @GetMapping("/exam")
    public ApiResponse<Map<String, Object>> examScores(@RequestParam("examId") Long examId, HttpSession session) {
        UserProfile user = (UserProfile) session.getAttribute(SESSION_KEY);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        if (!"Teacher".equalsIgnoreCase(user.getUserRole()) && !"Admin".equalsIgnoreCase(user.getUserRole())) {
            return ApiResponse.failure(403, "Forbidden");
        }
        Map<String, Object> payload = scoreService.examScores(examId);
        return ApiResponse.success(payload);
    }
}
