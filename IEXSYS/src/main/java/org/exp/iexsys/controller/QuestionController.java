package org.exp.iexsys.controller;

import jakarta.validation.Valid;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.Question;
import org.exp.iexsys.dto.QuestionCreateRequest;
import org.exp.iexsys.dto.QuestionUpdateRequest;
import org.exp.iexsys.service.QuestionService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> list(@RequestParam(value = "type", required = false) String type,
                                                 @RequestParam(value = "difficulty", required = false) String difficulty,
                                                 @RequestParam(value = "keyword", required = false) String keyword,
                                                 @RequestParam(value = "page", defaultValue = "1") int page,
                                                 @RequestParam(value = "size", defaultValue = "10") int size) {
        List<Question> list = questionService.list(type, difficulty, keyword, page, size);
        int total = questionService.count(type, difficulty, keyword);
        Map<String, Object> payload = new HashMap<>();
        payload.put("list", list);
        payload.put("total", total);
        payload.put("page", page);
        payload.put("size", size);
        return ApiResponse.success(payload);
    }

    @PostMapping
    public ApiResponse<Question> create(@Valid @RequestBody QuestionCreateRequest request) {
        return ApiResponse.success("创建成功", questionService.createQuestion(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<Question> update(@PathVariable("id") Long id, @Valid @RequestBody QuestionUpdateRequest request) {
        request.setQuestionId(id);
        return ApiResponse.success("更新成功", questionService.updateQuestion(request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable("id") Long id) {
        questionService.deleteQuestion(id);
        return ApiResponse.success("已删除");
    }

    @GetMapping("/{id}")
    public ApiResponse<Question> detail(@PathVariable("id") Long id) {
        Question question = questionService.findById(id);
        if (question == null) {
            return ApiResponse.failure(404, "题目不存在");
        }
        return ApiResponse.success(question);
    }
}
