-- 初始化数据库与用户表
CREATE DATABASE IF NOT EXISTS online_exam_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_exam_system;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT 'BCrypt密码',
    `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
    `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `role` INT(1) NOT NULL DEFAULT 0 COMMENT '角色：0-学生 1-老师 2-管理员',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 示例账户（密码均为明文所示的BCrypt哈希，方便首次登录）
INSERT INTO `user` (`username`, `password`, `real_name`, `role`) VALUES
('admin', '$2a$10$yggZNgxUjE1Zh3vhIebhOe9ZLzaaaTdL.JnJt5TxqHPj9mzHKorTm', '管理员', 2), -- 原始密码：admin123
('teacher', '$2a$10$aqrm7gv8R3bYVjJPQaVDIeSTC3aVLslBJPDVBq5J46lfLjyJxv03e', '张老师', 1), -- 原始密码：teacher123
('student', '$2a$10$lZZ19TTsraN0C9c9e3hV7OxBY70tDIbdwN9cbo59PiVeKnM2PyMq6', '李同学', 0); -- 原始密码：student123

