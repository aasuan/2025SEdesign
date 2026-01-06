package org.exp.iexsys.service;

import org.exp.iexsys.domain.ScoreRecord;

import java.util.List;
import java.util.Map;

public interface ScoreService {

    List<ScoreRecord> listByStudent(Long studentId);

    Map<String, Object> summary(Long studentId);

    /**
     * 学生查看单场考试详情（含答卷与题目）
     */
    Map<String, Object> examDetail(Long examId, Long studentId);

    /**
     * 教师查看考试成绩与汇总
     */
    Map<String, Object> examScores(Long examId);
}
