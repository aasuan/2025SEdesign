/*
 Navicat Premium Dump SQL

 Source Server         : dingcx_2025
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42)
 Source Host           : localhost:5432
 Source Schema         : online_exam_system

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42)
 File Encoding         : 65001

 Date: 23/12/2025 11:28:23
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
  `exam_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '考试实例名称',
  `start_time` datetime NOT NULL COMMENT '考试开始时间',
  `duration_minutes` int NOT NULL COMMENT '限时作答时长(分钟)',
  `anti_cheat_settings` json NULL COMMENT '防作弊设置 (如人脸识别要求)',
  PRIMARY KEY (`exam_id`) USING BTREE,
  INDEX `idx_exam_paper_id`(`paper_id` ASC) USING BTREE,
  CONSTRAINT `fk_exam_paper` FOREIGN KEY (`paper_id`) REFERENCES `paper` (`paper_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '考试表' ROW_FORMAT = Dynamic;

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
  `join_status` enum('Invited','Joined','Submitted') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Invited' COMMENT '参与状态',
  PRIMARY KEY (`ep_id`) USING BTREE,
  INDEX `idx_ep_exam_id`(`exam_id` ASC) USING BTREE,
  INDEX `idx_ep_student_id`(`student_id` ASC) USING BTREE,
  CONSTRAINT `fk_ep_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ep_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '考试参与表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of exam_participant
-- ----------------------------

-- ----------------------------
-- Table structure for paper
-- ----------------------------
DROP TABLE IF EXISTS `paper`;
CREATE TABLE `paper`  (
  `paper_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
  `paper_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试卷名称',
  `creator_id` bigint UNSIGNED NOT NULL COMMENT '组卷教师ID',
  `total_score` decimal(7, 2) NOT NULL DEFAULT 0.00 COMMENT '试卷总分',
  `extra_info` json NULL COMMENT '额外拓展字段 (智能组卷策略JSON)',
  PRIMARY KEY (`paper_id`) USING BTREE,
  INDEX `idx_paper_creator_id`(`creator_id` ASC) USING BTREE,
  CONSTRAINT `fk_paper_creator` FOREIGN KEY (`creator_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试卷模板表' ROW_FORMAT = Dynamic;

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
  `question_score` decimal(5, 2) NOT NULL COMMENT '该题在试卷中的分值',
  `sequence_num` int NOT NULL COMMENT '题目顺序号',
  PRIMARY KEY (`pq_id`) USING BTREE,
  INDEX `idx_pq_paper_id`(`paper_id` ASC) USING BTREE,
  INDEX `idx_pq_question_id`(`question_id` ASC) USING BTREE,
  CONSTRAINT `fk_pq_paper` FOREIGN KEY (`paper_id`) REFERENCES `paper` (`paper_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pq_question` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试卷-试题关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of paper_question
-- ----------------------------

-- ----------------------------
-- Table structure for question
-- ----------------------------
DROP TABLE IF EXISTS `question`;
CREATE TABLE `question`  (
  `question_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '试题ID',
  `creator_id` bigint UNSIGNED NOT NULL COMMENT '出题老师ID',
  `question_type` enum('SingleChoice','MultipleChoice','FillBlank','TrueFalse','ShortAnswer') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题目类型',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题干内容',
  `options` json NULL COMMENT '选择题选项 (JSON格式)',
  `answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标准答案/参考答案',
  `default_score` decimal(5, 2) NOT NULL DEFAULT 5.00 COMMENT '默认分值',
  `extra_info` json NULL COMMENT '额外拓展字段 (如图片/公式链接)',
  PRIMARY KEY (`question_id`) USING BTREE,
  INDEX `idx_question_creator_id`(`creator_id` ASC) USING BTREE,
  CONSTRAINT `fk_question_creator` FOREIGN KEY (`creator_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试题表' ROW_FORMAT = Dynamic;

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
  INDEX `idx_qt_question_id`(`question_id` ASC) USING BTREE,
  INDEX `idx_qt_tag_id`(`tag_id` ASC) USING BTREE,
  CONSTRAINT `fk_qt_question` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_qt_tag` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`tag_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试题-标签关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of question_tag
-- ----------------------------

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role`  (
  `role_id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色名称 (Admin/Teacher/Student)',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `extra_info` json NULL COMMENT '额外拓展字段',
  PRIMARY KEY (`role_id`) USING BTREE,
  UNIQUE INDEX `uk_role_name`(`role_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of role
-- ----------------------------
INSERT INTO `role` VALUES (1, 'Admin', '管理员', '2025-12-19 18:12:53', '2025-12-19 18:12:53', NULL);
INSERT INTO `role` VALUES (2, 'Teacher', '教师', '2025-12-19 18:12:53', '2025-12-19 18:12:53', NULL);
INSERT INTO `role` VALUES (3, 'Student', '学生', '2025-12-19 18:12:53', '2025-12-19 18:12:53', NULL);

-- ----------------------------
-- Table structure for score_record
-- ----------------------------
DROP TABLE IF EXISTS `score_record`;
CREATE TABLE `score_record`  (
  `record_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '成绩记录ID',
  `exam_id` bigint UNSIGNED NOT NULL COMMENT '考试ID',
  `student_id` bigint UNSIGNED NOT NULL COMMENT '考生ID',
  `total_score` decimal(7, 2) NULL DEFAULT NULL COMMENT '考试总得分',
  `is_final` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否为最终成绩 (所有主观题已批阅)',
  `ranking` int NULL DEFAULT NULL COMMENT '考试排名',
  PRIMARY KEY (`record_id`) USING BTREE,
  INDEX `idx_sr_exam_id`(`exam_id` ASC) USING BTREE,
  INDEX `idx_sr_student_id`(`student_id` ASC) USING BTREE,
  CONSTRAINT `fk_sr_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sr_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '成绩表' ROW_FORMAT = Dynamic;

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
  `student_response` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '学生作答内容',
  `is_graded` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已批阅/自动评分',
  `obtained_score` decimal(5, 2) NULL DEFAULT NULL COMMENT '该题得分',
  `save_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近一次保存时间 （断点准备）',
  `extra_info` json NULL COMMENT '额外拓展字段',
  PRIMARY KEY (`answer_id`) USING BTREE,
  INDEX `idx_sa_exam_id`(`exam_id` ASC) USING BTREE,
  INDEX `idx_sa_student_id`(`student_id` ASC) USING BTREE,
  INDEX `idx_sa_question_id`(`question_id` ASC) USING BTREE,
  CONSTRAINT `fk_sa_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`exam_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sa_question` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_sa_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学生答案记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of student_answer
-- ----------------------------

-- ----------------------------
-- Table structure for tag
-- ----------------------------
DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag`  (
  `tag_id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `tag_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标签名称 (如：Java基础, 简单)',
  `tag_type` enum('KnowledgePoint','Difficulty','Chapter') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标签类型',
  `extra_info` json NULL COMMENT '额外拓展字段',
  PRIMARY KEY (`tag_id`) USING BTREE,
  UNIQUE INDEX `uk_tag_name`(`tag_name` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '标签表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tag
-- ----------------------------

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `user_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录用户名/学号/工号',
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码哈希值',
  `real_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '真实姓名',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号',
  `status` enum('Active','Inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Active' COMMENT '用户状态 (Active, Inactive)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最近更新时间',
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `uk_username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, 'admin', '$2a$10$yggZNgxUjE1Zh3vhIebhOe9ZLzaaaTdL.JnJt5TxqHPj9mzHKorTm', '管理员', 'admin@example.com', '13800000001', 'Active', '2025-12-19 18:12:53', '2025-12-19 18:12:53');
INSERT INTO `user` VALUES (2, 'teacher', '$2a$10$aqrm7gv8R3bYVjJPQaVDIeSTC3aVLslBJPDVBq5J46lfLjyJxv03e', '张老师', 'teacher@example.com', '13800000002', 'Active', '2025-12-19 18:12:53', '2025-12-19 18:12:53');
INSERT INTO `user` VALUES (3, 'student', '$2a$10$lZZ19TTsraN0C9c9e3hV7OxBY70tDIbdwN9cbo59PiVeKnM2PyMq6', '李同学', 'student@example.com', '13800000003', 'Active', '2025-12-19 18:12:53', '2025-12-19 18:12:53');
INSERT INTO `user` VALUES (5, 'student001', '$2a$10$s3cynqUak.bM.5Wj89HjxOLNE5MA97zCPOxHgR8IV/LJwQM9N0s3S', '王五', 'wangwu@example.com', '13800000000', 'Active', '2025-12-19 18:42:36', '2025-12-19 18:42:36');
INSERT INTO `user` VALUES (6, 'student002', '$2a$10$wTBysGoek1VzbOebpUNMfOt2kgGOikEX2ArqNYOPpzGKukYBHJQae', '赵六', 'zhaoliu@example.com', '13800000004', 'Active', '2025-12-21 23:11:55', '2025-12-21 23:11:55');

-- ----------------------------
-- Table structure for user_role
-- ----------------------------
DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role`  (
  `user_role_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint UNSIGNED NOT NULL COMMENT '用户ID',
  `role_id` int UNSIGNED NOT NULL COMMENT '角色ID',
  PRIMARY KEY (`user_role_id`) USING BTREE,
  INDEX `idx_user_role_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_user_role_role_id`(`role_id` ASC) USING BTREE,
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户-角色关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_role
-- ----------------------------
INSERT INTO `user_role` VALUES (1, 1, 1);
INSERT INTO `user_role` VALUES (2, 3, 3);
INSERT INTO `user_role` VALUES (3, 2, 2);

SET FOREIGN_KEY_CHECKS = 1;
