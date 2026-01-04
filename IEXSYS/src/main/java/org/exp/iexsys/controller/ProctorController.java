package org.exp.iexsys.controller;

import jakarta.servlet.http.HttpSession;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.ProctorAlert;
import org.exp.iexsys.domain.ProctorCommand;
import org.exp.iexsys.dto.UserProfile;
import org.exp.iexsys.service.ProctorService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proctor")
@Validated
public class ProctorController {

    private static final String SESSION_KEY = "LOGIN_USER";
    private final ProctorService proctorService;

    public ProctorController(ProctorService proctorService) {
        this.proctorService = proctorService;
    }

    @GetMapping("/alerts")
    public ApiResponse<List<ProctorAlert>> listAlerts(@RequestParam("examId") Long examId,
                                                      HttpSession session) {
        requireLogin(session);
        return ApiResponse.success(proctorService.listAlerts(examId));
    }

    @PostMapping("/alerts/{id}/warn")
    public ApiResponse<ProctorAlert> warn(@PathVariable("id") Long alertId,
                                          @RequestBody(required = false) NotesReq req,
                                          HttpSession session) {
        UserProfile teacher = requireLogin(session);
        ProctorAlert alert = proctorService.markWarned(alertId, teacher.getId(), req == null ? null : req.getNotes());
        return ApiResponse.success(alert);
    }

    @PostMapping("/alerts/{id}/force-submit")
    public ApiResponse<ProctorAlert> forceSubmit(@PathVariable("id") Long alertId,
                                                 @RequestBody(required = false) NotesReq req,
                                                 HttpSession session) {
        UserProfile teacher = requireLogin(session);
        ProctorAlert alert = proctorService.markForcedSubmit(alertId, teacher.getId(), req == null ? null : req.getNotes());
        return ApiResponse.success(alert);
    }

    @GetMapping("/commands")
    public ApiResponse<List<ProctorCommand>> pollCommands(@RequestParam("examId") Long examId,
                                                          @RequestParam("studentId") Long studentId) {
        // 学生端轮询无需重复登录校验（考试入口已校验），如有需要可在此增加 session 校验
        return ApiResponse.success(proctorService.pollCommands(examId, studentId));
    }

    @PostMapping("/commands/{id}/delivered")
    public ApiResponse<Void> markDelivered(@PathVariable("id") Long cmdId) {
        proctorService.markCommandDelivered(cmdId);
        return ApiResponse.success(null);
    }

    /**
     * 老师手动触发全员人脸验证指令（对该考试所有考生下发 manual_verify 命令）
     */
    @PostMapping("/commands/manual-verify")
    public ApiResponse<Void> manualVerify(@RequestParam("examId") Long examId,
                                          @RequestBody(required = false) NotesReq req,
                                          HttpSession session) {
        requireLogin(session);
        proctorService.triggerManualVerify(examId, req == null ? null : req.getNotes());
        return ApiResponse.success(null);
    }

    private UserProfile requireLogin(HttpSession session) {
        UserProfile profile = (UserProfile) session.getAttribute(SESSION_KEY);
        if (profile == null || profile.getId() == null) {
            throw new IllegalArgumentException("未登录");
        }
        return profile;
    }

    public static class NotesReq {
        private String notes;

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }
}
