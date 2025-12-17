package org.example.controller;

import org.example.entity.Question;
import org.example.entity.User;
import org.example.service.QuestionService;
import org.example.util.JsonResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

/**
 * 题目控制器
 */
@RestController
@RequestMapping("/api/question")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    /**
     * 添加题目（仅老师和管理员）
     */
    @PostMapping("/add")
    public JsonResult<Void> addQuestion(@RequestBody Question question, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || (user.getRole() != 1 && user.getRole() != 2)) {
            return JsonResult.error(403, "无权限");
        }
        question.setCreatorId(user.getId());
        boolean success = questionService.addQuestion(question);
        if (success) {
            return JsonResult.success("添加成功");
        }
        return JsonResult.error("添加失败");
    }

    /**
     * 查询所有题目（仅老师和管理员）
     */
    @GetMapping("/list")
    public JsonResult<List<Question>> listQuestions(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || (user.getRole() != 1 && user.getRole() != 2)) {
            return JsonResult.error(403, "无权限");
        }
        List<Question> questions;
        if (user.getRole() == 2) {
            // 管理员查看所有题目
            questions = questionService.getAllQuestions();
        } else {
            // 老师只查看自己创建的题目
            questions = questionService.getQuestionsByCreatorId(user.getId());
        }
        return JsonResult.success(questions);
    }

    /**
     * 根据ID查询题目详情
     */
    @GetMapping("/{id}")
    public JsonResult<Question> getQuestion(@PathVariable Integer id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || (user.getRole() != 1 && user.getRole() != 2)) {
            return JsonResult.error(403, "无权限");
        }
        Question question = questionService.getQuestionById(id);
        if (question != null) {
            return JsonResult.success(question);
        }
        return JsonResult.error("题目不存在");
    }

    /**
     * 更新题目
     */
    @PostMapping("/update")
    public JsonResult<Void> updateQuestion(@RequestBody Question question, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || (user.getRole() != 1 && user.getRole() != 2)) {
            return JsonResult.error(403, "无权限");
        }
        boolean success = questionService.updateQuestion(question);
        if (success) {
            return JsonResult.success("更新成功");
        }
        return JsonResult.error("更新失败");
    }

    /**
     * 删除题目
     */
    @PostMapping("/delete/{id}")
    public JsonResult<Void> deleteQuestion(@PathVariable Integer id, HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user == null || (user.getRole() != 1 && user.getRole() != 2)) {
            return JsonResult.error(403, "无权限");
        }
        boolean success = questionService.deleteQuestion(id);
        if (success) {
            return JsonResult.success("删除成功");
        }
        return JsonResult.error("删除失败");
    }
}

