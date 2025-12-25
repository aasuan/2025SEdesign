package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.Question;

import java.util.List;

@Mapper
public interface QuestionMapper {

    int insert(Question question);

    int update(Question question);

    Question selectById(@Param("id") Long id);

    int disable(@Param("id") Long id);

    List<Question> list(@Param("type") String type,
                        @Param("difficulty") String difficulty,
                        @Param("keyword") String keyword,
                        @Param("tagIds") List<Integer> tagIds,
                        @Param("offset") int offset,
                        @Param("limit") int limit);

    int count(@Param("type") String type,
              @Param("difficulty") String difficulty,
              @Param("keyword") String keyword,
              @Param("tagIds") List<Integer> tagIds);

    List<Question> randomPickByType(@Param("type") String type, @Param("limit") int limit);
}
