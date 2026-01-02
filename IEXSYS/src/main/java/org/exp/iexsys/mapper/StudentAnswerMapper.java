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

    /**
     * 待批改答卷（可按考试过滤）
     */
    java.util.List<StudentAnswer> listUngraded(@Param("examId") Long examId);

    /**
     * 更新分数/评语
     */
    int grade(@Param("answerId") Long answerId,
              @Param("score") java.math.BigDecimal score,
              @Param("graderId") Long graderId,
              @Param("comment") String comment);

    /**
     * 某场考试剩余未批答卷数量
     */
    int countUngradedByExam(@Param("examId") Long examId);

    /**
     * 学生端查看答案详情（携带题目）
     */
    java.util.List<StudentAnswer> listWithQuestion(@Param("examId") Long examId, @Param("studentId") Long studentId);
}
