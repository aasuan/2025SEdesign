package org.exp.iexsys.service;

import org.exp.iexsys.domain.ProctorAlert;
import org.exp.iexsys.domain.ProctorCommand;

import java.util.List;

public interface ProctorService {

    ProctorAlert createAlert(Long examId, Long studentId, String capturedImg, Double similarity, String notes);

    List<ProctorAlert> listAlerts(Long examId);

    ProctorAlert markWarned(Long alertId, Long teacherId, String notes);

    ProctorAlert markForcedSubmit(Long alertId, Long teacherId, String notes);

    /**
     * 老师手动触发对整场考试所有考生的人脸验证（生成 manual_verify 指令，学生端收到后自行截帧验证）
     */
    void triggerManualVerify(Long examId, String notes);

    List<ProctorCommand> pollCommands(Long examId, Long studentId);

    void markCommandDelivered(Long cmdId);
}
