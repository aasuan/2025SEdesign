/*
 Navicat Premium Dump SQL

 Source Server         : myDB
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42)
 Source Host           : localhost:3306
 Source Schema         : online_exam_system

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42)
 File Encoding         : 65001

 Date: 22/12/2025 20:55:54
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for exam
-- ----------------------------
DROP TABLE IF EXISTS `exam`;
CREATE TABLE `exam`  (
  `exam_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '考试ID',
  `paper_id` bigint UNSIGNED NOT NULL COMMENT '使用的试卷ID',
  `exam_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '考试实例名称',
  `start_time` datetime NOT NULL COMMENT '考试开始时间',
  `end_time` datetime NOT NULL COMMENT '考试结束时间',
  `duration_minutes` int NOT NULL COMMENT '限时作答时长(分钟)',
  `proctor_id` bigint UNSIGNED NULL DEFAULT NULL COMMENT '监考老师ID',
  `status` enum('Pending','Active','Finished','Canceled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending' COMMENT '考试状态',
  `anti_cheat_settings` json NULL COMMENT '防作弊设置 (如: 人脸识别, 切屏次数限制)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `extra_info` json NULL COMMENT '额外拓展字段',
  PRIMARY KEY (`exam_id`) USING BTREE,
  INDEX `paper_id`(`paper_id` ASC) USING BTREE,
  INDEX `proctor_id`(`proctor_id` ASC) USING BTREE,
  CONSTRAINT `exam_ibfk_1` FOREIGN KEY (`paper_id`) REFERENCES `paper` (`paper_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `exam_ibfk_2` FOREIGN KEY (`proctor_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '考试安排实例表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of exam
-- ----------------------------

-- ----------------------------
-- Table structure for exam_participant
-- ----------------------------
DROP TABLE IF EXISTS `exam_participant`;
CREATE TABLE `exam_participant`  (
  `ep_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `exam_id` bigint UNSIGNED NOT NULL COMMENT '考试ID',
  `student_id` bigint UNSIGNED NOT NULL COMMENT '考生ID',
  `join_status` enum('Invited','Joined','Submitted','Absent') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Invited' COMMENT '参与状态',
  `join_time` datetime NULL DEFAULT NULL COMMENT '实际进入考试时间',
  `submit_time` datetime NULL DEFAULT NULL COMMENT '交卷时间',
  PRIMARY KEY (`ep_id`) USING BTREE,
  UNIQUE INDEX `uk_exam_student`(`exam_id` ASC, `student_id` ASC) USING BTREE,
  INDEX `student_id`(`student_id` ASC) USING BTREE,
  CONSTRAINT `exam_participant_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`exam_id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `exam_participant_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '考试参与者表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of exam_participant
-- ----------------------------

-- ----------------------------
-- Table structure for paper
-- ----------------------------
DROP TABLE IF EXISTS `paper`;
CREATE TABLE `paper`  (
  `paper_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
  `paper_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '试卷名称',
  `creator_id` bigint UNSIGNED NOT NULL COMMENT '组卷教师ID',
  `total_score` decimal(7, 2) NOT NULL DEFAULT 0.00 COMMENT '试卷总分 (由题目分数累加)',
  `is_draft` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否为草稿',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `extra_info` json NULL COMMENT '额外拓展字段 (如: 组卷策略JSON - n道选择, k道填空等)',
  PRIMARY KEY (`paper_id`) USING BTREE,
  INDEX `creator_id`(`creator_id` ASC) USING BTREE,
  CONSTRAINT `paper_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '试卷元数据表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of paper
-- ----------------------------

-- ----------------------------
-- Table structure for paper_question
-- ----------------------------
DROP TABLE IF EXISTS `paper_question`;
CREATE TABLE `paper_question`  (
  `pq_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `paper_id` bigint UNSIGNED NOT NULL COMMENT '试卷ID',
  `question_id` bigint UNSIGNED NOT NULL COMMENT '试题ID',
  `question_score` decimal(5, 2) NOT NULL COMMENT '该题在本次试卷中的分值',
  `sequence_num` int NOT NULL COMMENT '题目在试卷中的顺序',
  PRIMARY KEY (`pq_id`) USING BTREE,
  UNIQUE INDEX `uk_paper_question`(`paper_id` ASC, `question_id` ASC) USING BTREE,
  INDEX `question_id`(`question_id` ASC) USING BTREE,
  CONSTRAINT `paper_question_ibfk_1` FOREIGN KEY (`paper_id`) REFERENCES `paper` (`paper_id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `paper_question_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '试卷包含的试题及其分值、顺序' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of paper_question
-- ----------------------------

-- ----------------------------
-- Table structure for question
-- ----------------------------
DROP TABLE IF EXISTS `question`;
CREATE TABLE `question`  (
  `question_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '试题ID',
  `creator_id` bigint UNSIGNED NOT NULL COMMENT '创建者/出题老师ID',
  `question_type` enum('SingleChoice','MultiChoice','TrueFalse','FillBlank','ShortAnswer','Programming') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '题目类型',
  `difficulty` enum('简单','中等','困难') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '难度等级',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '题干内容',
  `options` json NULL COMMENT '选择题选项 (JSON格式)',
  `answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标准答案/参考答案',
  `default_score` decimal(5, 2) NOT NULL DEFAULT 5.00 COMMENT '默认分值',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `extra_info` json NULL COMMENT '额外拓展字段 (如: 图片/公式链接)',
  PRIMARY KEY (`question_id`) USING BTREE,
  INDEX `creator_id`(`creator_id` ASC) USING BTREE,
  CONSTRAINT `question_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '题库主表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of question
-- ----------------------------

-- ----------------------------
-- Table structure for question_tag
-- ----------------------------
DROP TABLE IF EXISTS `question_tag`;
CREATE TABLE `question_tag`  (
  `qt_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `question_id` bigint UNSIGNED NOT NULL COMMENT '试题ID',
  `tag_id` int UNSIGNED NOT NULL COMMENT '标签ID',
  PRIMARY KEY (`qt_id`) USING BTREE,
  UNIQUE INDEX `uk_question_tag`(`question_id` ASC, `tag_id` ASC) USING BTREE,
  INDEX `tag_id`(`tag_id` ASC) USING BTREE,
  CONSTRAINT `question_tag_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `question_tag_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`tag_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '试题与标签的多对多关系表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of question_tag
-- ----------------------------

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role`  (
  `role_id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称 (如: 管理员, 教师, 学生)',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '角色描述',
  PRIMARY KEY (`role_id`) USING BTREE,
  UNIQUE INDEX `role_name`(`role_name` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统角色表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of role
-- ----------------------------

-- ----------------------------
-- Table structure for score_record
-- ----------------------------
DROP TABLE IF EXISTS `score_record`;
CREATE TABLE `score_record`  (
  `record_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '成绩记录ID',
  `exam_id` bigint UNSIGNED NOT NULL COMMENT '考试ID',
  `student_id` bigint UNSIGNED NOT NULL COMMENT '考生ID',
  `paper_id` bigint UNSIGNED NOT NULL COMMENT '试卷ID',
  `total_score` decimal(7, 2) NULL DEFAULT NULL COMMENT '总得分 (所有题目得分之和)',
  `is_final` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否为最终成绩',
  `ranking` int NULL DEFAULT NULL COMMENT '考试排名',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `extra_info` json NULL COMMENT '额外拓展字段 (如: 成绩分析报告ID)',
  PRIMARY KEY (`record_id`) USING BTREE,
  UNIQUE INDEX `uk_score_exam_student`(`exam_id` ASC, `student_id` ASC) USING BTREE,
  INDEX `student_id`(`student_id` ASC) USING BTREE,
  INDEX `paper_id`(`paper_id` ASC) USING BTREE,
  CONSTRAINT `score_record_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`exam_id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `score_record_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `score_record_ibfk_3` FOREIGN KEY (`paper_id`) REFERENCES `paper` (`paper_id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '考试总成绩记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of score_record
-- ----------------------------

-- ----------------------------
-- Table structure for student_answer
-- ----------------------------
DROP TABLE IF EXISTS `student_answer`;
CREATE TABLE `student_answer`  (
  `answer_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '答案ID',
  `exam_id` bigint UNSIGNED NOT NULL COMMENT '考试ID',
  `student_id` bigint UNSIGNED NOT NULL COMMENT '考生ID',
  `question_id` bigint UNSIGNED NOT NULL COMMENT '试题ID',
  `student_response` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '学生作答内容',
  `is_graded` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已批阅/自动评分',
  `obtained_score` decimal(5, 2) NULL DEFAULT NULL COMMENT '该题获得的分数',
  `grader_id` bigint UNSIGNED NULL DEFAULT NULL COMMENT '批阅人ID (主观题)',
  `grade_time` datetime NULL DEFAULT NULL COMMENT '批阅时间',
  `save_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最近一次保存/更新时间 (断点续答)',
  `extra_info` json NULL COMMENT '额外拓展字段 (如: 自动评分结果, 批阅评语)',
  PRIMARY KEY (`answer_id`) USING BTREE,
  UNIQUE INDEX `uk_answer_exam_student_question`(`exam_id` ASC, `student_id` ASC, `question_id` ASC) USING BTREE,
  INDEX `student_id`(`student_id` ASC) USING BTREE,
  INDEX `question_id`(`question_id` ASC) USING BTREE,
  INDEX `grader_id`(`grader_id` ASC) USING BTREE,
  CONSTRAINT `student_answer_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`exam_id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `student_answer_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `student_answer_ibfk_3` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `student_answer_ibfk_4` FOREIGN KEY (`grader_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '学生答题记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of student_answer
-- ----------------------------

-- ----------------------------
-- Table structure for tag
-- ----------------------------
DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag`  (
  `tag_id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `tag_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签名称 (如: Java基础, 章节A)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`tag_id`) USING BTREE,
  UNIQUE INDEX `uk_tag_name_type`(`tag_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '试题标签表 (支持知识点、章节等)' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of tag
-- ----------------------------

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `user_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登录用户名/学号/工号',
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码哈希值',
  `real_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '真实姓名',
  `phone_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号码',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱',
  `user_role` enum('管理员','教师','学生') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户角色',
  `status` enum('Active','Locked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active' COMMENT '用户状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `extra_info` json NULL COMMENT '额外拓展字段',
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `phone_number`(`phone_number` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统用户表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user
-- ----------------------------

-- ----------------------------
-- View structure for v_student_exam_history
-- ----------------------------
DROP VIEW IF EXISTS `v_student_exam_history`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_student_exam_history` AS select `ep`.`student_id` AS `student_id`,`u`.`real_name` AS `student_name`,`e`.`exam_id` AS `exam_id`,`e`.`exam_name` AS `exam_name`,`e`.`start_time` AS `start_time`,`p`.`paper_name` AS `paper_name`,`p`.`total_score` AS `paper_total_score`,`sr`.`total_score` AS `student_obtained_score`,`sr`.`is_final` AS `is_final`,`ep`.`join_status` AS `join_status` from ((((`exam_participant` `ep` join `exam` `e` on((`ep`.`exam_id` = `e`.`exam_id`))) join `paper` `p` on((`e`.`paper_id` = `p`.`paper_id`))) join `user` `u` on((`ep`.`student_id` = `u`.`user_id`))) left join `score_record` `sr` on(((`ep`.`exam_id` = `sr`.`exam_id`) and (`ep`.`student_id` = `sr`.`student_id`)))) order by `e`.`start_time` desc;

-- ----------------------------
-- View structure for v_teacher_question_summary
-- ----------------------------
DROP VIEW IF EXISTS `v_teacher_question_summary`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_teacher_question_summary` AS select `q`.`question_id` AS `question_id`,`q`.`creator_id` AS `creator_id`,`u`.`real_name` AS `creator_name`,`q`.`question_type` AS `question_type`,`q`.`difficulty` AS `difficulty`,`q`.`content` AS `content`,`q`.`default_score` AS `default_score`,`q`.`is_active` AS `is_active`,group_concat(`t`.`tag_name` order by `t`.`tag_name` ASC separator '; ') AS `tags_list` from (((`question` `q` join `user` `u` on((`q`.`creator_id` = `u`.`user_id`))) left join `question_tag` `qt` on((`q`.`question_id` = `qt`.`question_id`))) left join `tag` `t` on((`qt`.`tag_id` = `t`.`tag_id`))) group by `q`.`question_id`,`q`.`creator_id`,`u`.`real_name`,`q`.`question_type`,`q`.`difficulty`,`q`.`content`,`q`.`default_score`,`q`.`is_active` order by `q`.`question_id` desc;

-- ----------------------------
-- View structure for v_ungraded_subjective_answers
-- ----------------------------
DROP VIEW IF EXISTS `v_ungraded_subjective_answers`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_ungraded_subjective_answers` AS select `sa`.`answer_id` AS `answer_id`,`sa`.`exam_id` AS `exam_id`,`e`.`exam_name` AS `exam_name`,`sa`.`student_id` AS `student_id`,`u`.`real_name` AS `student_name`,`sa`.`question_id` AS `question_id`,`q`.`content` AS `question_content`,`q`.`default_score` AS `default_score`,`sa`.`student_response` AS `student_response`,`sa`.`save_time` AS `last_saved_time` from (((`student_answer` `sa` join `question` `q` on((`sa`.`question_id` = `q`.`question_id`))) join `exam` `e` on((`sa`.`exam_id` = `e`.`exam_id`))) join `user` `u` on((`sa`.`student_id` = `u`.`user_id`))) where ((`sa`.`is_graded` = false) and (`q`.`question_type` in ('ShortAnswer','Programming')) and (`e`.`status` = 'Finished')) order by `e`.`end_time`;

-- ----------------------------
-- Triggers structure for table paper_question
-- ----------------------------
DROP TRIGGER IF EXISTS `trg_paper_total_score_insert`;
delimiter ;;
CREATE TRIGGER `trg_paper_total_score_insert` AFTER INSERT ON `paper_question` FOR EACH ROW BEGIN
    UPDATE paper p
    SET p.total_score = (
        SELECT SUM(question_score)
        FROM paper_question
        WHERE paper_id = NEW.paper_id
    )
    WHERE p.paper_id = NEW.paper_id;
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table paper_question
-- ----------------------------
DROP TRIGGER IF EXISTS `trg_paper_total_score_update`;
delimiter ;;
CREATE TRIGGER `trg_paper_total_score_update` AFTER UPDATE ON `paper_question` FOR EACH ROW BEGIN
    IF OLD.question_score <> NEW.question_score OR OLD.paper_id <> NEW.paper_id THEN
        -- 如果 paper_id 变更，更新旧试卷总分
        IF OLD.paper_id <> NEW.paper_id THEN
             UPDATE paper p
             SET p.total_score = (
                 SELECT COALESCE(SUM(question_score), 0)
                 FROM paper_question
                 WHERE paper_id = OLD.paper_id
             )
             WHERE p.paper_id = OLD.paper_id;
        END IF;
        
        -- 更新新试卷总分
        UPDATE paper p
        SET p.total_score = (
            SELECT SUM(question_score)
            FROM paper_question
            WHERE paper_id = NEW.paper_id
        )
        WHERE p.paper_id = NEW.paper_id;
    END IF;
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table paper_question
-- ----------------------------
DROP TRIGGER IF EXISTS `trg_paper_total_score_delete`;
delimiter ;;
CREATE TRIGGER `trg_paper_total_score_delete` AFTER DELETE ON `paper_question` FOR EACH ROW BEGIN
    UPDATE paper p
    SET p.total_score = (
        SELECT COALESCE(SUM(question_score), 0)
        FROM paper_question
        WHERE paper_id = OLD.paper_id
    )
    WHERE p.paper_id = OLD.paper_id;
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table student_answer
-- ----------------------------
DROP TRIGGER IF EXISTS `trg_update_score_record_on_grade`;
delimiter ;;
CREATE TRIGGER `trg_update_score_record_on_grade` AFTER UPDATE ON `student_answer` FOR EACH ROW BEGIN
    DECLARE v_total_score DECIMAL(7, 2);
    DECLARE v_total_questions INT;
    DECLARE v_graded_questions INT;
    
    -- 仅在得分变化或批阅状态变化时执行
    IF OLD.obtained_score <> NEW.obtained_score OR (OLD.is_graded = FALSE AND NEW.is_graded = TRUE) THEN
        
        -- 1. 计算当前考试和学生的总得分
        SELECT SUM(obtained_score) INTO v_total_score
        FROM student_answer
        WHERE exam_id = NEW.exam_id AND student_id = NEW.student_id;

        -- 2. 检查所有题目是否都已批阅 (用于设置 is_final 状态)
        SELECT COUNT(pq.question_id), SUM(CASE WHEN sa.is_graded = TRUE THEN 1 ELSE 0 END)
        INTO v_total_questions, v_graded_questions
        FROM paper_question pq
        JOIN exam e ON pq.paper_id = e.paper_id
        LEFT JOIN student_answer sa ON sa.exam_id = NEW.exam_id AND sa.student_id = NEW.student_id AND sa.question_id = pq.question_id
        WHERE e.exam_id = NEW.exam_id;

        -- 3. 插入或更新成绩记录 (使用 ON DUPLICATE KEY UPDATE 保证事务幂等性)
        INSERT INTO score_record (exam_id, student_id, paper_id, total_score, is_final)
        VALUES (NEW.exam_id, NEW.student_id, (SELECT paper_id FROM exam WHERE exam_id = NEW.exam_id), v_total_score, (v_total_questions = v_graded_questions))
        ON DUPLICATE KEY UPDATE 
            total_score = v_total_score, 
            is_final = (v_total_questions = v_graded_questions),
            updated_at = CURRENT_TIMESTAMP;
            
    END IF;
END
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
