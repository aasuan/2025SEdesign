package org.exp.iexsys.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.exp.iexsys.domain.ProctorAlert;

import java.util.List;

@Mapper
public interface ProctorAlertMapper {

    int insert(ProctorAlert alert);

    List<ProctorAlert> listByExam(@Param("examId") Long examId);

    int updateStatus(@Param("alertId") Long alertId,
                     @Param("status") String status,
                     @Param("handledBy") Long handledBy);

    ProctorAlert findById(@Param("alertId") Long alertId);
}
