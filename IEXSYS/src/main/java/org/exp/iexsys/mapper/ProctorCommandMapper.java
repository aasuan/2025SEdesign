package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.ProctorCommand;

import java.util.List;

@Mapper
public interface ProctorCommandMapper {

    int insert(ProctorCommand command);

    List<ProctorCommand> listUndelivered(@Param("examId") Long examId, @Param("studentId") Long studentId);

    int markDelivered(@Param("cmdId") Long cmdId);
}
