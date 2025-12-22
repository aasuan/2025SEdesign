package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.Paper;

import java.util.List;

@Mapper
public interface PaperMapper {

    int insert(Paper paper);

    int updateBasic(Paper paper);

    Paper selectById(@Param("id") Long id);

    List<Paper> listByCreator(@Param("creatorId") Long creatorId);
}
