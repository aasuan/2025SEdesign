package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.Tag;

import java.util.List;

@Mapper
public interface TagMapper {

    int insert(Tag tag);

    Tag selectById(@Param("id") Integer id);

    Tag selectByName(@Param("name") String name);

    List<Tag> selectAll(@Param("tagType") String tagType);
}
