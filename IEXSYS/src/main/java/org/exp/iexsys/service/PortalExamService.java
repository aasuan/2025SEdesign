package org.exp.iexsys.service;

import org.exp.iexsys.domain.StudentAnswer;
import org.exp.iexsys.dto.PortalAnswerSaveRequest;
import org.exp.iexsys.dto.PortalEventRequest;

import java.util.List;
import java.util.Map;

public interface PortalExamService {

    List<Map<String, Object>> listAvailable(Long studentId);

    Map<String, Object> enter(Long examId, Long studentId);

    void heartbeat(Long examId, Long studentId);

    void recordEvent(Long examId, Long studentId, PortalEventRequest request);

    List<Map<String, Object>> listQuestions(Long examId, Long studentId);

    StudentAnswer saveAnswer(Long examId, Long studentId, PortalAnswerSaveRequest request);

    void submit(Long examId, Long studentId);
}
