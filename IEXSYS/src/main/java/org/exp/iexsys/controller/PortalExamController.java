package org.exp.iexsys.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.StudentAnswer;
import org.exp.iexsys.dto.PortalAnswerSaveRequest;
import org.exp.iexsys.dto.PortalEventRequest;
import org.exp.iexsys.dto.UserProfile;
import org.exp.iexsys.service.PortalExamService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portal/exams")
public class PortalExamController {

    private static final String SESSION_KEY = "LOGIN_USER";

    private final PortalExamService portalExamService;

    public PortalExamController(PortalExamService portalExamService) {
        this.portalExamService = portalExamService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(HttpSession session) {
        UserProfile user = currentUser(session);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        return ApiResponse.success(portalExamService.listAvailable(user.getId()));
    }

    @PostMapping("/{id}/enter")
    public ApiResponse<Map<String, Object>> enter(@PathVariable("id") Long examId, HttpSession session) {
        UserProfile user = currentUser(session);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        return ApiResponse.success(portalExamService.enter(examId, user.getId()));
    }

    @PostMapping("/{id}/heartbeat")
    public ApiResponse<Void> heartbeat(@PathVariable("id") Long examId, HttpSession session) {
        UserProfile user = currentUser(session);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        portalExamService.heartbeat(examId, user.getId());
        return ApiResponse.success("ok");
    }

    @PostMapping("/{id}/events")
    public ApiResponse<Void> events(@PathVariable("id") Long examId,
                                    @Valid @RequestBody PortalEventRequest request,
                                    HttpSession session) {
        UserProfile user = currentUser(session);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        portalExamService.recordEvent(examId, user.getId(), request);
        return ApiResponse.success("ok");
    }

    @GetMapping("/{id}/questions")
    public ApiResponse<List<Map<String, Object>>> questions(@PathVariable("id") Long examId, HttpSession session) {
        UserProfile user = currentUser(session);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        return ApiResponse.success(portalExamService.listQuestions(examId, user.getId()));
    }

    @PostMapping("/{id}/answers")
    public ApiResponse<StudentAnswer> saveAnswer(@PathVariable("id") Long examId,
                                                 @Valid @RequestBody PortalAnswerSaveRequest request,
                                                 HttpSession session) {
        UserProfile user = currentUser(session);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        return ApiResponse.success(portalExamService.saveAnswer(examId, user.getId(), request));
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<Void> submit(@PathVariable("id") Long examId, HttpSession session) {
        UserProfile user = currentUser(session);
        if (user == null) {
            return ApiResponse.failure(401, "Not logged in");
        }
        portalExamService.submit(examId, user.getId());
        return ApiResponse.success("submitted");
    }

    private UserProfile currentUser(HttpSession session) {
        return (UserProfile) session.getAttribute(SESSION_KEY);
    }
}
