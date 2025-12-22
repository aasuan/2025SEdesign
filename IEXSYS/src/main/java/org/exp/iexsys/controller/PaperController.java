package org.exp.iexsys.controller;

import jakarta.validation.Valid;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.Paper;
import org.exp.iexsys.domain.PaperQuestion;
import org.exp.iexsys.dto.AutoAssembleRequest;
import org.exp.iexsys.dto.PaperAdjustRequest;
import org.exp.iexsys.dto.PaperCreateRequest;
import org.exp.iexsys.service.PaperService;
import org.exp.iexsys.mapper.PaperQuestionMapper;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/papers")
public class PaperController {

    private final PaperService paperService;
    private final PaperQuestionMapper paperQuestionMapper;

    public PaperController(PaperService paperService, PaperQuestionMapper paperQuestionMapper) {
        this.paperService = paperService;
        this.paperQuestionMapper = paperQuestionMapper;
    }

    @PostMapping
    public ApiResponse<Paper> create(@Valid @RequestBody PaperCreateRequest request) {
        return ApiResponse.success("创建并组卷成功", paperService.createAndAssemble(request));
    }

    @PostMapping("/{id}/auto-assemble")
    public ApiResponse<Paper> autoAssemble(@PathVariable("id") Long id, @Valid @RequestBody AutoAssembleRequest request) {
        return ApiResponse.success("组卷完成", paperService.autoAssemble(id, request.getRules()));
    }

    @PostMapping("/{id}/questions")
    public ApiResponse<Paper> adjustQuestions(@PathVariable("id") Long id, @Valid @RequestBody PaperAdjustRequest request) {
        return ApiResponse.success("试卷已更新", paperService.updateQuestions(id, request));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> detail(@PathVariable("id") Long id) {
        Paper paper = paperService.findById(id);
        if (paper == null) {
            return ApiResponse.failure(404, "试卷不存在");
        }
        List<PaperQuestion> items = paperQuestionMapper.selectByPaperId(id);
        Map<String, Object> result = new HashMap<>();
        result.put("paper", paper);
        result.put("items", items);
        return ApiResponse.success(result);
    }

    @GetMapping
    public ApiResponse<List<Paper>> list(@RequestParam(value = "creatorId", required = false) Long creatorId) {
        return ApiResponse.success(paperService.listByCreator(creatorId));
    }
}
