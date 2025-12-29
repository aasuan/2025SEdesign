package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.StudentAnswer;

import java.util.List;

@Mapper
public interface StudentAnswerMapper {

    int upsert(StudentAnswer answer);

    List<StudentAnswer> listByExamAndStudent(@Param("examId") Long examId,
                                             @Param("studentId") Long studentId);

    StudentAnswer selectOne(@Param("examId") Long examId,
                            @Param("studentId") Long studentId,
                            @Param("questionId") Long questionId);
}
