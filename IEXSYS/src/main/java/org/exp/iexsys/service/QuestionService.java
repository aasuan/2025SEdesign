package org.exp.iexsys.service;

import org.exp.iexsys.domain.Question;
import org.exp.iexsys.dto.QuestionCreateRequest;
import org.exp.iexsys.dto.QuestionUpdateRequest;

import java.util.List;

public interface QuestionService {

    Question createQuestion(QuestionCreateRequest request);

    Question updateQuestion(QuestionUpdateRequest request);

    void deleteQuestion(Long questionId);

    List<Question> list(String type, String difficulty, String keyword, int page, int size);

    int count(String type, String difficulty, String keyword);

    Question findById(Long questionId);
}
