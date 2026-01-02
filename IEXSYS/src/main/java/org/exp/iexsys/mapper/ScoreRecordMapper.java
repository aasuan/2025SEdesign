package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.ScoreRecord;

import java.util.List;
import java.util.Map;

@Mapper
public interface ScoreRecordMapper {

    List<ScoreRecord> listByStudent(@Param("studentId") Long studentId);

    Map<String, Object> summaryByStudent(@Param("studentId") Long studentId, @Param("passLine") Integer passLine);

    ScoreRecord selectOne(@Param("examId") Long examId, @Param("studentId") Long studentId);
}
