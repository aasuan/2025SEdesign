package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.dto.QuestionTagView;

import java.util.List;

@Mapper
public interface QuestionTagMapper {

    int deleteByQuestionId(@Param("questionId") Long questionId);

    int insertBatch(@Param("questionId") Long questionId, @Param("tagIds") List<Integer> tagIds);

    List<QuestionTagView> selectByQuestionIds(@Param("questionIds") List<Long> questionIds);
}
