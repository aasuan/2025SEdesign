package org.example.mapper;

import org.example.entity.Question;

import java.util.List;

public interface QuestionMapper {
    Question selectById(Integer id);
    List<Question> selectAll();
    List<Question> selectByCreatorId(Integer creatorId);
    int insert(Question question);
    int update(Question question);
    int delete(Integer id);
}

