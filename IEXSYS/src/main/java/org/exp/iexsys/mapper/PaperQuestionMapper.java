package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.PaperQuestion;

import java.util.List;

@Mapper
public interface PaperQuestionMapper {

    int deleteByPaperId(@Param("paperId") Long paperId);

    int insertBatch(@Param("items") List<PaperQuestion> items);

    List<PaperQuestion> selectByPaperId(@Param("paperId") Long paperId);
}
