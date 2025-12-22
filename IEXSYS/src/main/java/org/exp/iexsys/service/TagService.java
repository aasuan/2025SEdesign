package org.exp.iexsys.service;

import org.exp.iexsys.domain.Tag;

import java.util.List;

public interface TagService {
    Tag create(Tag tag);

    List<Tag> list(String tagType);
}
