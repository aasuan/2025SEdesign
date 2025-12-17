package org.example.service;

import org.example.entity.Question;

import java.util.List;

public interface QuestionService {
    /**
     * 添加题目
     */
    boolean addQuestion(Question question);

    /**
     * 根据ID查询题目
     */
    Question getQuestionById(Integer id);

    /**
     * 查询所有题目
     */
    List<Question> getAllQuestions();

    /**
     * 根据创建者ID查询题目
     */
    List<Question> getQuestionsByCreatorId(Integer creatorId);

    /**
     * 更新题目
     */
    boolean updateQuestion(Question question);

    /**
     * 删除题目
     */
    boolean deleteQuestion(Integer id);
}

