package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.Question;
import org.exp.iexsys.dto.QuestionCreateRequest;
import org.exp.iexsys.dto.QuestionUpdateRequest;
import org.exp.iexsys.dto.QuestionTagView;
import org.exp.iexsys.mapper.QuestionMapper;
import org.exp.iexsys.mapper.QuestionTagMapper;
import org.exp.iexsys.service.QuestionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

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
        Question created = questionMapper.selectById(q.getQuestionId());
        attachTags(Collections.singletonList(created));
        return created;
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
        Question updated = questionMapper.selectById(existing.getQuestionId());
        attachTags(Collections.singletonList(updated));
        return updated;
    }

    @Override
    public void deleteQuestion(Long questionId) {
        questionMapper.disable(questionId);
        questionTagMapper.deleteByQuestionId(questionId);
    }

    @Override
    public List<Question> list(String type, String difficulty, String keyword, List<Integer> tagIds, int page, int size) {
        int offset = Math.max(page, 1) - 1;
        offset = offset * Math.max(size, 1);
        List<Question> questions = questionMapper.list(type, difficulty, keyword, tagIds, offset, size);
        attachTags(questions);
        return questions;
    }

    @Override
    public int count(String type, String difficulty, String keyword, List<Integer> tagIds) {
        return questionMapper.count(type, difficulty, keyword, tagIds);
    }

    @Override
    public Question findById(Long questionId) {
        Question question = questionMapper.selectById(questionId);
        if (question != null) {
            attachTags(Collections.singletonList(question));
        }
        return question;
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

    private void attachTags(List<Question> questions) {
        if (CollectionUtils.isEmpty(questions)) {
            return;
        }
        List<Long> ids = questions.stream()
                .map(Question::getQuestionId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (CollectionUtils.isEmpty(ids)) {
            return;
        }
        List<QuestionTagView> relations = questionTagMapper.selectByQuestionIds(ids);
        if (CollectionUtils.isEmpty(relations)) {
            questions.forEach(q -> {
                q.setTagIds(Collections.emptyList());
                q.setTagNames(Collections.emptyList());
            });
            return;
        }
        Map<Long, List<QuestionTagView>> grouped = relations.stream()
                .filter(rel -> rel.getQuestionId() != null)
                .collect(Collectors.groupingBy(QuestionTagView::getQuestionId));
        questions.forEach(q -> {
            List<QuestionTagView> rels = grouped.get(q.getQuestionId());
            if (CollectionUtils.isEmpty(rels)) {
                q.setTagIds(Collections.emptyList());
                q.setTagNames(Collections.emptyList());
                return;
            }
            q.setTagIds(rels.stream()
                    .map(QuestionTagView::getTagId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList()));
            q.setTagNames(rels.stream()
                    .map(QuestionTagView::getTagName)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList()));
        });
    }
}
