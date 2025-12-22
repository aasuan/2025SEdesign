package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.Paper;
import org.exp.iexsys.domain.PaperQuestion;
import org.exp.iexsys.domain.Question;
import org.exp.iexsys.dto.PaperAdjustRequest;
import org.exp.iexsys.dto.PaperCreateRequest;
import org.exp.iexsys.dto.PaperQuestionItemDto;
import org.exp.iexsys.dto.PaperRule;
import org.exp.iexsys.mapper.PaperMapper;
import org.exp.iexsys.mapper.PaperQuestionMapper;
import org.exp.iexsys.mapper.QuestionMapper;
import org.exp.iexsys.service.PaperService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class PaperServiceImpl implements PaperService {

    private final PaperMapper paperMapper;
    private final PaperQuestionMapper paperQuestionMapper;
    private final QuestionMapper questionMapper;

    public PaperServiceImpl(PaperMapper paperMapper, PaperQuestionMapper paperQuestionMapper, QuestionMapper questionMapper) {
        this.paperMapper = paperMapper;
        this.paperQuestionMapper = paperQuestionMapper;
        this.questionMapper = questionMapper;
    }

    @Override
    public Paper createAndAssemble(PaperCreateRequest request) {
        Paper paper = new Paper();
        paper.setPaperName(request.getPaperName());
        paper.setCreatorId(request.getCreatorId());
        paper.setDraft(request.getDraft() == null ? Boolean.TRUE : request.getDraft());
        paper.setTotalScore(BigDecimal.ZERO);
        paperMapper.insert(paper);
        assemble(paper, request.getRules());
        return paperMapper.selectById(paper.getPaperId());
    }

    @Override
    public Paper autoAssemble(Long paperId, List<PaperRule> rules) {
        Paper paper = paperMapper.selectById(paperId);
        if (paper == null) {
            throw new IllegalArgumentException("试卷不存在");
        }
        assemble(paper, rules);
        return paperMapper.selectById(paperId);
    }

    @Override
    public Paper updateQuestions(Long paperId, PaperAdjustRequest request) {
        Paper paper = paperMapper.selectById(paperId);
        if (paper == null) {
            throw new IllegalArgumentException("试卷不存在");
        }
        List<PaperQuestionItemDto> items = request.getItems();
        if (CollectionUtils.isEmpty(items)) {
            throw new IllegalArgumentException("题目列表不能为空");
        }
        List<PaperQuestion> toSave = new ArrayList<>();
        BigDecimal totalScore = BigDecimal.ZERO;
        for (PaperQuestionItemDto dto : items) {
            PaperQuestion pq = new PaperQuestion();
            pq.setPaperId(paperId);
            pq.setQuestionId(dto.getQuestionId());
            pq.setQuestionScore(dto.getQuestionScore());
            pq.setSequenceNum(dto.getSequenceNum());
            toSave.add(pq);
            totalScore = totalScore.add(dto.getQuestionScore());
        }
        paperQuestionMapper.deleteByPaperId(paperId);
        paperQuestionMapper.insertBatch(toSave);
        paper.setTotalScore(totalScore);
        if (request.getDraft() != null) {
            paper.setDraft(request.getDraft());
        }
        paperMapper.updateBasic(paper);
        return paperMapper.selectById(paperId);
    }

    @Override
    public Paper findById(Long paperId) {
        return paperMapper.selectById(paperId);
    }

    @Override
    public List<Paper> listByCreator(Long creatorId) {
        return paperMapper.listByCreator(creatorId);
    }

    private void assemble(Paper paper, List<PaperRule> rules) {
        if (CollectionUtils.isEmpty(rules)) {
            throw new IllegalArgumentException("组卷规则不能为空");
        }
        List<PaperQuestion> assembled = new ArrayList<>();
        BigDecimal totalScore = BigDecimal.ZERO;
        int sequence = 1;
        for (PaperRule rule : rules) {
            List<Question> picked = questionMapper.randomPickByType(rule.getQuestionType(), rule.getCount());
            if (picked.size() < rule.getCount()) {
                throw new IllegalArgumentException("题型 " + rule.getQuestionType() + " 题目数量不足");
            }
            BigDecimal perScore = rule.getScorePerQuestion();
            for (int i = 0; i < rule.getCount(); i++) {
                Question q = picked.get(i);
                PaperQuestion pq = new PaperQuestion();
                pq.setPaperId(paper.getPaperId());
                pq.setQuestionId(q.getQuestionId());
                BigDecimal score = perScore != null ? perScore : defaultScore(q.getDefaultScore());
                pq.setQuestionScore(score);
                pq.setSequenceNum(sequence++);
                assembled.add(pq);
                totalScore = totalScore.add(score);
            }
        }
        paperQuestionMapper.deleteByPaperId(paper.getPaperId());
        paperQuestionMapper.insertBatch(assembled);
        paper.setTotalScore(totalScore);
        paperMapper.updateBasic(paper);
    }

    private BigDecimal defaultScore(BigDecimal value) {
        return value == null ? BigDecimal.valueOf(5) : value;
    }
}
