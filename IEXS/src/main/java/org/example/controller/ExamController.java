package org.example.controller;

import org.example.entity.Exam;
import org.example.entity.User;
import org.example.service.ExamService;
import org.example.util.JsonResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

/**
 * 考试控制器
 */
@RestController
@RequestMapping("/api/exam")
public class ExamController {

    @Autowired
    private ExamService examService;

    /**
     * 创建考试（仅老师和管理员）
     */
    @PostMapping("/create")
    public JsonResult<Void> createExam(@RequestBody Map<String, Object> params, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || (user.getRole() != 1 && user.getRole() != 2)) {
            return JsonResult.error(403, "无权限");
        }
        
        Exam exam = new Exam();
        exam.setExamName((String) params.get("examName"));
        exam.setDescription((String) params.get("description"));
        exam.setDuration(((Number) params.get("duration")).intValue());
        exam.setTotalScore(((Number) params.get("totalScore")).intValue());
        // 处理日期：支持时间戳（long）或日期字符串
        Object startTimeObj = params.get("startTime");
        Object endTimeObj = params.get("endTime");
        if (startTimeObj instanceof Number) {
            exam.setStartTime(new java.util.Date(((Number) startTimeObj).longValue()));
        } else if (startTimeObj instanceof String) {
            // 如果前端传的是日期字符串，可以使用SimpleDateFormat解析
            exam.setStartTime(new java.util.Date(Long.parseLong((String) startTimeObj)));
        }
        if (endTimeObj instanceof Number) {
            exam.setEndTime(new java.util.Date(((Number) endTimeObj).longValue()));
        } else if (endTimeObj instanceof String) {
            exam.setEndTime(new java.util.Date(Long.parseLong((String) endTimeObj)));
        }
        exam.setCreatorId(user.getId());
        exam.setStatus(0);
        
        @SuppressWarnings("unchecked")
        List<Integer> questionIds = (List<Integer>) params.get("questionIds");
        
        boolean success = examService.createExam(exam, questionIds);
        if (success) {
            return JsonResult.success("创建成功");
        }
        return JsonResult.error("创建失败");
    }

    /**
     * 查询所有考试（老师查看自己创建的）
     */
    @GetMapping("/list")
    public JsonResult<List<Exam>> listExams(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return JsonResult.error(401, "未登录");
        }
        List<Exam> exams;
        if (user.getRole() == 1 || user.getRole() == 2) {
            exams = examService.getExamsByCreatorId(user.getId());
        } else {
            exams = examService.getAvailableExams();
        }
        return JsonResult.success(exams);
    }

    /**
     * 查询可参加的考试（学生）
     */
    @GetMapping("/available")
    public JsonResult<List<Exam>> getAvailableExams(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null) {
            return JsonResult.error(401, "未登录");
        }
        List<Exam> exams = examService.getAvailableExams();
        return JsonResult.success(exams);
    }

    /**
     * 根据ID查询考试详情
     */
    @GetMapping("/{id}")
    public JsonResult<Exam> getExam(@PathVariable Integer id) {
        Exam exam = examService.getExamById(id);
        if (exam != null) {
            return JsonResult.success(exam);
        }
        return JsonResult.error("考试不存在");
    }
}

