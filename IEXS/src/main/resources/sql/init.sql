-- 创建数据库
CREATE DATABASE IF NOT EXISTS iexs DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iexs;

-- 用户表
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `role` INT(1) NOT NULL DEFAULT 0 COMMENT '角色：0-学生 1-老师 2-管理员',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 题目表
DROP TABLE IF EXISTS `question`;
CREATE TABLE `question` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '题目ID',
  `title` TEXT NOT NULL COMMENT '题目内容',
  `type` VARCHAR(20) NOT NULL COMMENT '题目类型：single(单选)、multiple(多选)、judge(判断)、essay(简答)',
  `option_a` VARCHAR(255) DEFAULT NULL COMMENT '选项A',
  `option_b` VARCHAR(255) DEFAULT NULL COMMENT '选项B',
  `option_c` VARCHAR(255) DEFAULT NULL COMMENT '选项C',
  `option_d` VARCHAR(255) DEFAULT NULL COMMENT '选项D',
  `correct_answer` TEXT NOT NULL COMMENT '正确答案',
  `analysis` TEXT DEFAULT NULL COMMENT '解析',
  `score` INT(11) NOT NULL DEFAULT 5 COMMENT '分值',
  `difficulty` INT(1) NOT NULL DEFAULT 2 COMMENT '难度：1-简单 2-中等 3-困难',
  `creator_id` INT(11) NOT NULL COMMENT '创建者ID（老师）',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_creator_id` (`creator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目表';

-- 考试表
DROP TABLE IF EXISTS `exam`;
CREATE TABLE `exam` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '考试ID',
  `exam_name` VARCHAR(200) NOT NULL COMMENT '考试名称',
  `description` TEXT DEFAULT NULL COMMENT '考试描述',
  `duration` INT(11) NOT NULL COMMENT '考试时长（分钟）',
  `total_score` INT(11) NOT NULL DEFAULT 100 COMMENT '总分',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `creator_id` INT(11) NOT NULL COMMENT '创建者ID（老师）',
  `status` INT(1) NOT NULL DEFAULT 0 COMMENT '状态：0-未开始 1-进行中 2-已结束',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_creator_id` (`creator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试表';

-- 考试题目关联表
DROP TABLE IF EXISTS `exam_question`;
CREATE TABLE `exam_question` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `exam_id` INT(11) NOT NULL COMMENT '考试ID',
  `question_id` INT(11) NOT NULL COMMENT '题目ID',
  `order_num` INT(11) NOT NULL DEFAULT 0 COMMENT '题目顺序',
  PRIMARY KEY (`id`),
  KEY `idx_exam_id` (`exam_id`),
  KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试题目关联表';

-- 考场表（考试与学生的关联）
DROP TABLE IF EXISTS `exam_room`;
CREATE TABLE `exam_room` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '考场ID',
  `exam_id` INT(11) NOT NULL COMMENT '考试ID',
  `student_id` INT(11) NOT NULL COMMENT '学生ID',
  `status` INT(1) NOT NULL DEFAULT 0 COMMENT '状态：0-未开始 1-答题中 2-已交卷',
  `start_time` DATETIME DEFAULT NULL COMMENT '学生开始答题时间',
  `submit_time` DATETIME DEFAULT NULL COMMENT '交卷时间',
  `score` INT(11) DEFAULT NULL COMMENT '得分',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_id` (`exam_id`),
  KEY `idx_student_id` (`student_id`),
  UNIQUE KEY `uk_exam_student` (`exam_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考场表';

-- 考试记录表（学生答题记录）
DROP TABLE IF EXISTS `exam_record`;
CREATE TABLE `exam_record` (
  `id` INT(11) NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `exam_room_id` INT(11) NOT NULL COMMENT '考场ID',
  `question_id` INT(11) NOT NULL COMMENT '题目ID',
  `student_answer` TEXT DEFAULT NULL COMMENT '学生答案',
  `score` INT(11) DEFAULT NULL COMMENT '该题得分',
  `answer_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '答题时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_room_id` (`exam_room_id`),
  KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试记录表';

-- 插入测试数据
-- 插入管理员账号（密码：admin123，实际应该加密存储）
INSERT INTO `user` (`username`, `password`, `real_name`, `role`) VALUES 
('admin', 'admin123', '管理员', 2);

-- 插入测试老师账号（密码：teacher123）
INSERT INTO `user` (`username`, `password`, `real_name`, `role`) VALUES 
('teacher', 'teacher123', '张老师', 1);

-- 插入测试学生账号（密码：student123）
INSERT INTO `user` (`username`, `password`, `real_name`, `role`) VALUES 
('student', 'student123', '李同学', 0);

