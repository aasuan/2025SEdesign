package org.exp.iexsys.controller;

import jakarta.validation.Valid;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.Tag;
import org.exp.iexsys.service.TagService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public ApiResponse<List<Tag>> list(@RequestParam(value = "tagType", required = false) String tagType) {
        return ApiResponse.success(tagService.list(tagType));
    }

    @PostMapping
    public ApiResponse<Tag> create(@Valid @RequestBody Tag tag) {
        return ApiResponse.success("创建成功", tagService.create(tag));
    }
}
