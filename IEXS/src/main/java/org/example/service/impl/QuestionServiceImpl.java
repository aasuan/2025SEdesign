package org.example.service.impl;

import org.example.entity.Question;
import org.example.mapper.QuestionMapper;
import org.example.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class QuestionServiceImpl implements QuestionService {

    @Autowired
    private QuestionMapper questionMapper;

    @Override
    public boolean addQuestion(Question question) {
        return questionMapper.insert(question) > 0;
    }

    @Override
    public Question getQuestionById(Integer id) {
        return questionMapper.selectById(id);
    }

    @Override
    public List<Question> getAllQuestions() {
        return questionMapper.selectAll();
    }

    @Override
    public List<Question> getQuestionsByCreatorId(Integer creatorId) {
        return questionMapper.selectByCreatorId(creatorId);
    }

    @Override
    public boolean updateQuestion(Question question) {
        return questionMapper.update(question) > 0;
    }

    @Override
    public boolean deleteQuestion(Integer id) {
        return questionMapper.delete(id) > 0;
    }
}

