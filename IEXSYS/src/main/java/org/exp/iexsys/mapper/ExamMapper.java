package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.Exam;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ExamMapper {

    int insert(Exam exam);

    int update(Exam exam);

    Exam selectById(@Param("id") Long id);

    List<Exam> selectByIds(@Param("ids") List<Long> ids);

    List<Exam> list(@Param("status") String status,
                    @Param("startFrom") LocalDateTime startFrom,
                    @Param("startTo") LocalDateTime startTo);

    int updateStatus(@Param("id") Long id, @Param("status") String status);
}
