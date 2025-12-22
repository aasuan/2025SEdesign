package org.exp.iexsys.service;

import org.exp.iexsys.domain.Paper;
import org.exp.iexsys.dto.PaperAdjustRequest;
import org.exp.iexsys.dto.PaperCreateRequest;
import org.exp.iexsys.dto.PaperRule;

import java.util.List;

public interface PaperService {

    Paper createAndAssemble(PaperCreateRequest request);

    Paper autoAssemble(Long paperId, List<PaperRule> rules);

    Paper updateQuestions(Long paperId, PaperAdjustRequest request);

    Paper findById(Long paperId);

    List<Paper> listByCreator(Long creatorId);
}
