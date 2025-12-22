package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.Tag;
import org.exp.iexsys.mapper.TagMapper;
import org.exp.iexsys.service.TagService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TagServiceImpl implements TagService {

    private final TagMapper tagMapper;

    public TagServiceImpl(TagMapper tagMapper) {
        this.tagMapper = tagMapper;
    }

    @Override
    public Tag create(Tag tag) {
        Tag exists = tagMapper.selectByName(tag.getTagName());
        if (exists != null) {
            throw new IllegalArgumentException("标签已存在");
        }
        tagMapper.insert(tag);
        return tagMapper.selectById(tag.getTagId());
    }

    @Override
    public List<Tag> list(String tagType) {
        return tagMapper.selectAll(tagType);
    }
}
