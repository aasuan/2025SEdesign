-- 初始化数据库
CREATE DATABASE IF NOT EXISTS online_exam_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_exam_system;

-- 先删除外键表再删除主表，避免约束冲突
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `score_record`;
DROP TABLE IF EXISTS `student_answer`;
DROP TABLE IF EXISTS `exam_participant`;
DROP TABLE IF EXISTS `exam`;
DROP TABLE IF EXISTS `paper_question`;
DROP TABLE IF EXISTS `paper`;
DROP TABLE IF EXISTS `question_tag`;
DROP TABLE IF EXISTS `question`;
DROP TABLE IF EXISTS `tag`;
DROP TABLE IF EXISTS `user_role`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `role`;

SET FOREIGN_KEY_CHECKS = 1;

-- 角色表
CREATE TABLE `role` (
    `role_id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色ID',
    `role_name` VARCHAR(50) NOT NULL COMMENT '角色名称 (Admin/Teacher/Student)',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `extra_info` JSON NULL COMMENT '额外拓展字段',
    PRIMARY KEY (`role_id`),
    UNIQUE KEY `uk_role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 用户表
CREATE TABLE `user` (
    `user_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(100) NOT NULL COMMENT '登录用户名/学号/工号',
    `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希值',
    `real_name` VARCHAR(100) NOT NULL COMMENT '真实姓名',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `phone_number` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `user_role` ENUM('管理员', '教师', '学生') NOT NULL DEFAULT '学生' COMMENT '用户角色',
    `status` ENUM('Active', 'Locked') NOT NULL DEFAULT 'Active' COMMENT '用户状态 (Active, Locked)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最近更新时间',
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_phone` (`phone_number`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 用户-角色关联表
CREATE TABLE `user_role` (
    `user_role_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `role_id` INT UNSIGNED NOT NULL COMMENT '角色ID',
    PRIMARY KEY (`user_role_id`),
    KEY `idx_user_role_user_id` (`user_id`),
    KEY `idx_user_role_role_id` (`role_id`),
    CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户-角色关联表';

-- 标签表
CREATE TABLE `tag` (
    `tag_id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '标签ID',
    `tag_name` VARCHAR(100) NOT NULL COMMENT '标签名称 (如：Java基础, 简单)',
    `tag_type` ENUM('KnowledgePoint', 'Difficulty', 'Chapter') NOT NULL COMMENT '标签类型',
    `extra_info` JSON NULL COMMENT '额外拓展字段',
    PRIMARY KEY (`tag_id`),
    UNIQUE KEY `uk_tag_name` (`tag_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签表';

-- 试题表
CREATE TABLE `question` (
    `question_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '试题ID',
    `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '出题老师ID',
    `question_type` ENUM('SingleChoice', 'MultipleChoice', 'FillBlank', 'TrueFalse', 'ShortAnswer') NOT NULL COMMENT '题目类型',
    `content` TEXT NOT NULL COMMENT '题干内容',
    `options` JSON NULL COMMENT '选择题选项 (JSON格式)',
    `answer` TEXT NOT NULL COMMENT '标准答案/参考答案',
    `default_score` DECIMAL(5, 2) NOT NULL DEFAULT 5 COMMENT '默认分值',
    `extra_info` JSON NULL COMMENT '额外拓展字段 (如图片/公式链接)',
    PRIMARY KEY (`question_id`),
    KEY `idx_question_creator_id` (`creator_id`),
    CONSTRAINT `fk_question_creator` FOREIGN KEY (`creator_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试题表';

-- 试题-标签关联表
CREATE TABLE `question_tag` (
    `qt_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `question_id` BIGINT UNSIGNED NOT NULL COMMENT '试题ID',
    `tag_id` INT UNSIGNED NOT NULL COMMENT '标签ID',
    PRIMARY KEY (`qt_id`),
    KEY `idx_qt_question_id` (`question_id`),
    KEY `idx_qt_tag_id` (`tag_id`),
    CONSTRAINT `fk_qt_question` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_qt_tag` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`tag_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试题-标签关联表';

-- 试卷模板表
CREATE TABLE `paper` (
    `paper_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
    `paper_name` VARCHAR(255) NOT NULL COMMENT '试卷名称',
    `creator_id` BIGINT UNSIGNED NOT NULL COMMENT '组卷教师ID',
    `total_score` DECIMAL(7, 2) NOT NULL DEFAULT 0 COMMENT '试卷总分',
    `is_draft` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否草稿',
    `extra_info` JSON NULL COMMENT '额外拓展字段 (智能组卷策略JSON)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`paper_id`),
    KEY `idx_paper_creator_id` (`creator_id`),
    CONSTRAINT `fk_paper_creator` FOREIGN KEY (`creator_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试卷模板表';

-- 试卷-试题关联表
CREATE TABLE `paper_question` (
    `pq_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `paper_id` BIGINT UNSIGNED NOT NULL COMMENT '试卷ID',
    `question_id` BIGINT UNSIGNED NOT NULL COMMENT '试题ID',
    `question_score` DECIMAL(5, 2) NOT NULL COMMENT '该题在试卷中的分值',
    `sequence_num` INT NOT NULL COMMENT '题目顺序号',
    PRIMARY KEY (`pq_id`),
    KEY `idx_pq_paper_id` (`paper_id`),
    KEY `idx_pq_question_id` (`question_id`),
    CONSTRAINT `fk_pq_paper` FOREIGN KEY (`paper_id`) REFERENCES `paper` (`paper_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_pq_question` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试卷-试题关联表';

-- 考试表
CREATE TABLE `exam` (
    `exam_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '考试ID',
    `paper_id` BIGINT UNSIGNED NOT NULL COMMENT '使用的试卷ID',
    `exam_name` VARCHAR(255) NOT NULL COMMENT '考试实例名称',
    `start_time` DATETIME NOT NULL COMMENT '考试开始时间',
    `duration_minutes` INT NOT NULL COMMENT '限时作答时长(分钟)',
    `anti_cheat_settings` JSON NULL COMMENT '防作弊设置 (如人脸识别要求)',
    PRIMARY KEY (`exam_id`),
    KEY `idx_exam_paper_id` (`paper_id`),
    CONSTRAINT `fk_exam_paper` FOREIGN KEY (`paper_id`) REFERENCES `paper` (`paper_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试表';

-- 考试参与表
CREATE TABLE `exam_participant` (
    `ep_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `exam_id` BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
    `student_id` BIGINT UNSIGNED NOT NULL COMMENT '考生ID',
    `join_status` ENUM('Invited', 'Joined', 'Submitted') NOT NULL DEFAULT 'Invited' COMMENT '参与状态',
    PRIMARY KEY (`ep_id`),
    KEY `idx_ep_exam_id` (`exam_id`),
    KEY `idx_ep_student_id` (`student_id`),
    CONSTRAINT `fk_ep_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_ep_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试参与表';

-- 学生答案记录表
CREATE TABLE `student_answer` (
    `answer_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '答案ID',
    `exam_id` BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
    `student_id` BIGINT UNSIGNED NOT NULL COMMENT '考生ID',
    `question_id` BIGINT UNSIGNED NOT NULL COMMENT '试题ID',
    `student_response` TEXT NULL COMMENT '学生作答内容',
    `is_graded` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已批阅/自动评分',
    `obtained_score` DECIMAL(5, 2) NULL COMMENT '该题得分',
    `save_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近一次保存时间 （断点准备）',
    `extra_info` JSON NULL COMMENT '额外拓展字段',
    PRIMARY KEY (`answer_id`),
    KEY `idx_sa_exam_id` (`exam_id`),
    KEY `idx_sa_student_id` (`student_id`),
    KEY `idx_sa_question_id` (`question_id`),
    CONSTRAINT `fk_sa_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sa_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_sa_question` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生答案记录表';

-- 成绩表
CREATE TABLE `score_record` (
    `record_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '成绩记录ID',
    `exam_id` BIGINT UNSIGNED NOT NULL COMMENT '考试ID',
    `student_id` BIGINT UNSIGNED NOT NULL COMMENT '考生ID',
    `total_score` DECIMAL(7, 2) NULL COMMENT '考试总得分',
    `is_final` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否为最终成绩 (所有主观题已批阅)',
    `ranking` INT NULL COMMENT '考试排名',
    PRIMARY KEY (`record_id`),
    KEY `idx_sr_exam_id` (`exam_id`),
    KEY `idx_sr_student_id` (`student_id`),
    CONSTRAINT `fk_sr_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_sr_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成绩表';

-- 基础示例数据：角色与用户
INSERT INTO `role` (`role_name`, `description`) VALUES
('Admin', '管理员'),
('Teacher', '教师'),
('Student', '学生');

INSERT INTO `user` (`username`, `password_hash`, `real_name`, `email`, `phone_number`, `user_role`, `status`) VALUES
('admin', '$2a$10$yggZNgxUjE1Zh3vhIebhOe9ZLzaaaTdL.JnJt5TxqHPj9mzHKorTm', '管理员', 'admin@example.com', '13800000001', '管理员', 'Active'),  -- 原始密码：admin123
('teacher', '$2a$10$aqrm7gv8R3bYVjJPQaVDIeSTC3aVLslBJPDVBq5J46lfLjyJxv03e', '张老师', 'teacher@example.com', '13800000002', '教师', 'Active'), -- 原始密码：teacher123
('student', '$2a$10$lZZ19TTsraN0C9c9e3hV7OxBY70tDIbdwN9cbo59PiVeKnM2PyMq6', '李同学', 'student@example.com', '13800000003', '学生', 'Active'); -- 原始密码：student123

-- 将示例用户与角色关联
INSERT INTO `user_role` (`user_id`, `role_id`)
SELECT u.user_id, r.role_id
FROM `user` u
JOIN `role` r
WHERE (u.username = 'admin' AND r.role_name = 'Admin')
   OR (u.username = 'teacher' AND r.role_name = 'Teacher')
   OR (u.username = 'student' AND r.role_name = 'Student');

