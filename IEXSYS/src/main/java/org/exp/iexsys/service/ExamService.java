package org.exp.iexsys.service;

import org.exp.iexsys.domain.Exam;
import org.exp.iexsys.domain.ExamParticipant;

import java.time.LocalDateTime;
import java.util.List;

public interface ExamService {

    List<Exam> list(String status, LocalDateTime startFrom, LocalDateTime startTo);

    Exam create(Exam exam);

    Exam update(Long id, Exam exam);

    Exam findById(Long id);

    Exam publish(Long id);

    Exam cancel(Long id);

    List<ExamParticipant> listParticipants(Long examId);

    void addParticipants(Long examId, List<Long> studentIds);
}
