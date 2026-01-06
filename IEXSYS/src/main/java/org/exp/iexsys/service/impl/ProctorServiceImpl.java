package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.ProctorAlert;
import org.exp.iexsys.domain.ProctorCommand;
import org.exp.iexsys.domain.ExamParticipant;
import org.exp.iexsys.mapper.ProctorAlertMapper;
import org.exp.iexsys.mapper.ProctorCommandMapper;
import org.exp.iexsys.mapper.ExamParticipantMapper;
import org.exp.iexsys.service.ProctorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@Transactional
public class ProctorServiceImpl implements ProctorService {

    private final ProctorAlertMapper alertMapper;
    private final ProctorCommandMapper commandMapper;
    private final ExamParticipantMapper examParticipantMapper;

    public ProctorServiceImpl(ProctorAlertMapper alertMapper, ProctorCommandMapper commandMapper, ExamParticipantMapper examParticipantMapper) {
        this.alertMapper = alertMapper;
        this.commandMapper = commandMapper;
        this.examParticipantMapper = examParticipantMapper;
    }

    @Override
    public ProctorAlert createAlert(Long examId, Long studentId, String capturedImg, Double similarity, String notes) {
        ProctorAlert alert = new ProctorAlert();
        alert.setExamId(examId);
        alert.setStudentId(studentId);
        alert.setCapturedImg(capturedImg);
        alert.setSimilarity(similarity);
        alert.setStatus("pending");
        alert.setNotes(trimToNull(notes));
        alertMapper.insert(alert);
        return alertMapper.findById(alert.getAlertId());
    }

    @Override
    public List<ProctorAlert> listAlerts(Long examId) {
        return alertMapper.listByExam(examId);
    }

    @Override
    public ProctorAlert markWarned(Long alertId, Long teacherId, String notes) {
        updateStatus(alertId, "warned", teacherId, notes, "warn");
        return alertMapper.findById(alertId);
    }

    @Override
    public ProctorAlert markForcedSubmit(Long alertId, Long teacherId, String notes) {
        updateStatus(alertId, "forced_submit", teacherId, notes, "force_submit");
        return alertMapper.findById(alertId);
    }

    @Override
    public void triggerManualVerify(Long examId, String notes) {
        List<ExamParticipant> participants = examParticipantMapper.listByExamId(examId);
        if (participants == null || participants.isEmpty()) {
            return;
        }
        for (ExamParticipant ep : participants) {
            ProctorCommand cmd = new ProctorCommand();
            cmd.setExamId(examId);
            cmd.setStudentId(ep.getStudentId());
            cmd.setCmdType("manual_verify");
            cmd.setPayload(trimToNull(notes));
            cmd.setDelivered(false);
            commandMapper.insert(cmd);
        }
    }

    private void updateStatus(Long alertId, String status, Long teacherId, String notes, String cmdType) {
        ProctorAlert existing = alertMapper.findById(alertId);
        if (existing == null) {
            throw new IllegalArgumentException("告警不存在");
        }
        alertMapper.updateStatus(alertId, status, teacherId);
        // 被强制提交时，直接将考生状态标记为已提交，防止重新进入考试
        if ("force_submit".equalsIgnoreCase(cmdType)) {
            examParticipantMapper.markSubmitted(existing.getExamId(), existing.getStudentId());
        }
        ProctorCommand cmd = new ProctorCommand();
        cmd.setExamId(existing.getExamId());
        cmd.setStudentId(existing.getStudentId());
        cmd.setCmdType(cmdType);
        cmd.setAlertId(alertId);
        cmd.setPayload(trimToNull(notes));
        cmd.setDelivered(false);
        commandMapper.insert(cmd);
    }

    @Override
    public List<ProctorCommand> pollCommands(Long examId, Long studentId) {
        return commandMapper.listUndelivered(examId, studentId);
    }

    @Override
    public void markCommandDelivered(Long cmdId) {
        commandMapper.markDelivered(cmdId);
    }

    private String trimToNull(String val) {
        if (!StringUtils.hasText(val)) return null;
        return val.trim();
    }
}
