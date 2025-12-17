package org.example.controller;

import org.example.entity.ExamRoom;
import org.example.entity.Question;
import org.example.entity.User;
import org.example.service.ExamRoomService;
import org.example.util.JsonResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

/**
 * 考场控制器
 */
@RestController
@RequestMapping("/api/examRoom")
public class ExamRoomController {

    @Autowired
    private ExamRoomService examRoomService;

    /**
     * 参加考试
     */
    @PostMapping("/join")
    public JsonResult<ExamRoom> joinExam(@RequestBody Map<String, Integer> params, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || user.getRole() != 0) {
            return JsonResult.error(403, "只有学生可以参加考试");
        }
        
        Integer examId = params.get("examId");
        ExamRoom examRoom = examRoomService.joinExam(examId, user.getId());
        return JsonResult.success("参加成功", examRoom);
    }

    /**
     * 开始答题
     */
    @PostMapping("/start/{examRoomId}")
    public JsonResult<Void> startExam(@PathVariable Integer examRoomId, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || user.getRole() != 0) {
            return JsonResult.error(403, "无权限");
        }
        boolean success = examRoomService.startExam(examRoomId);
        if (success) {
            return JsonResult.success("开始答题");
        }
        return JsonResult.error("无法开始答题");
    }

    /**
     * 获取考试题目列表
     */
    @GetMapping("/questions/{examRoomId}")
    public JsonResult<List<Question>> getQuestions(@PathVariable Integer examRoomId, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || user.getRole() != 0) {
            return JsonResult.error(403, "无权限");
        }
        List<Question> questions = examRoomService.getExamQuestions(examRoomId);
        return JsonResult.success(questions);
    }

    /**
     * 提交答案
     */
    @PostMapping("/submitAnswer")
    public JsonResult<Void> submitAnswer(@RequestBody Map<String, Object> params, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || user.getRole() != 0) {
            return JsonResult.error(403, "无权限");
        }
        Integer examRoomId = ((Number) params.get("examRoomId")).intValue();
        Integer questionId = ((Number) params.get("questionId")).intValue();
        String answer = (String) params.get("answer");
        
        boolean success = examRoomService.submitAnswer(examRoomId, questionId, answer);
        if (success) {
            return JsonResult.success("提交成功");
        }
        return JsonResult.error("提交失败");
    }

    /**
     * 交卷
     */
    @PostMapping("/submit/{examRoomId}")
    public JsonResult<Map<String, Object>> submitExam(@PathVariable Integer examRoomId, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || user.getRole() != 0) {
            return JsonResult.error(403, "无权限");
        }
        boolean success = examRoomService.submitExam(examRoomId);
        if (success) {
            ExamRoom examRoom = examRoomService.getExamRoomById(examRoomId);
            Map<String, Object> data = new java.util.HashMap<>();
            data.put("score", examRoom.getScore());
            return JsonResult.success("交卷成功", data);
        }
        return JsonResult.error("交卷失败");
    }

    /**
     * 查询学生的考试记录
     */
    @GetMapping("/myExams")
    public JsonResult<List<ExamRoom>> getMyExams(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || user.getRole() != 0) {
            return JsonResult.error(403, "无权限");
        }
        List<ExamRoom> examRooms = examRoomService.getExamRoomsByStudentId(user.getId());
        return JsonResult.success(examRooms);
    }
}

