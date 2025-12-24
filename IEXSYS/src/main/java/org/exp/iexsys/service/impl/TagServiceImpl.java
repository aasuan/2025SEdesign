package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.Tag;
import org.exp.iexsys.mapper.TagMapper;
import org.exp.iexsys.service.TagService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class TagServiceImpl implements TagService {

    private final TagMapper tagMapper;

    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "KnowledgePoint", "Difficulty", "Chapter", "Others"
    );

    public TagServiceImpl(TagMapper tagMapper) {
        this.tagMapper = tagMapper;
    }

    private String normalizeType(String tagType) {
        if (!StringUtils.hasText(tagType)) {
            return "Others";
        }
        String normalized = tagType.trim();
        // 兼容大小写
        for (String allowed : ALLOWED_TYPES) {
            if (allowed.equalsIgnoreCase(normalized)) {
                return allowed;
            }
        }
        throw new IllegalArgumentException("标签类型不合法，允许值：" + ALLOWED_TYPES);
    }

    @Override
    public Tag create(Tag tag) {
        Tag exists = tagMapper.selectByName(tag.getTagName());
        if (exists != null) {
            throw new IllegalArgumentException("标签已存在");
        }
        tag.setTagType(normalizeType(tag.getTagType()));
        tagMapper.insert(tag);
        return tagMapper.selectById(tag.getTagId());
    }

    @Override
    public List<Tag> list(String tagType) {
        return tagMapper.selectAll(StringUtils.hasText(tagType) ? normalizeType(tagType) : null);
    }
}
