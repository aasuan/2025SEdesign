package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.ExamParticipant;

import java.util.List;

@Mapper
public interface ExamParticipantMapper {

    int insertBatch(@Param("examId") Long examId, @Param("studentIds") List<Long> studentIds);

    List<ExamParticipant> listByExamId(@Param("examId") Long examId);

    List<ExamParticipant> listByStudentId(@Param("studentId") Long studentId);

    ExamParticipant selectOne(@Param("examId") Long examId, @Param("studentId") Long studentId);

    int updateStatus(@Param("examId") Long examId,
                     @Param("studentId") Long studentId,
                     @Param("joinStatus") String joinStatus);

    int touchHeartbeat(@Param("examId") Long examId, @Param("studentId") Long studentId);

    int markSubmitted(@Param("examId") Long examId, @Param("studentId") Long studentId);
}
