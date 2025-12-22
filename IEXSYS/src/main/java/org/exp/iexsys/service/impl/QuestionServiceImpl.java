package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.Question;
import org.exp.iexsys.dto.QuestionCreateRequest;
import org.exp.iexsys.dto.QuestionUpdateRequest;
import org.exp.iexsys.mapper.QuestionMapper;
import org.exp.iexsys.mapper.QuestionTagMapper;
import org.exp.iexsys.service.QuestionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class QuestionServiceImpl implements QuestionService {

    private final QuestionMapper questionMapper;
    private final QuestionTagMapper questionTagMapper;

    public QuestionServiceImpl(QuestionMapper questionMapper, QuestionTagMapper questionTagMapper) {
        this.questionMapper = questionMapper;
        this.questionTagMapper = questionTagMapper;
    }

    @Override
    public Question createQuestion(QuestionCreateRequest request) {
        Question q = new Question();
        q.setCreatorId(request.getCreatorId());
        q.setQuestionType(request.getQuestionType());
        q.setDifficulty(request.getDifficulty());
        q.setContent(request.getContent());
        q.setOptions(request.getOptions());
        q.setAnswer(request.getAnswer());
        q.setDefaultScore(defaultScore(request.getDefaultScore()));
        questionMapper.insert(q);
        bindTags(q.getQuestionId(), request.getTagIds());
        return questionMapper.selectById(q.getQuestionId());
    }

    @Override
    public Question updateQuestion(QuestionUpdateRequest request) {
        Question existing = questionMapper.selectById(request.getQuestionId());
        if (existing == null) {
            throw new IllegalArgumentException("题目不存在");
        }
        existing.setQuestionType(request.getQuestionType());
        existing.setDifficulty(request.getDifficulty());
        existing.setContent(request.getContent());
        existing.setOptions(request.getOptions());
        existing.setAnswer(request.getAnswer());
        existing.setDefaultScore(defaultScore(request.getDefaultScore()));
        questionMapper.update(existing);
        bindTags(existing.getQuestionId(), request.getTagIds());
        return questionMapper.selectById(existing.getQuestionId());
    }

    @Override
    public void deleteQuestion(Long questionId) {
        questionMapper.disable(questionId);
        questionTagMapper.deleteByQuestionId(questionId);
    }

    @Override
    public List<Question> list(String type, String difficulty, String keyword, int page, int size) {
        int offset = Math.max(page, 1) - 1;
        offset = offset * Math.max(size, 1);
        return questionMapper.list(type, difficulty, keyword, offset, size);
    }

    @Override
    public int count(String type, String difficulty, String keyword) {
        return questionMapper.count(type, difficulty, keyword);
    }

    @Override
    public Question findById(Long questionId) {
        return questionMapper.selectById(questionId);
    }

    private BigDecimal defaultScore(BigDecimal input) {
        return input == null ? BigDecimal.valueOf(5) : input;
    }

    private void bindTags(Long questionId, List<Integer> tagIds) {
        questionTagMapper.deleteByQuestionId(questionId);
        if (!CollectionUtils.isEmpty(tagIds)) {
            questionTagMapper.insertBatch(questionId, tagIds);
        }
    }
}
