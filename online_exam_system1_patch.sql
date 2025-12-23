-- Patch script to align the running database (online_exam_system1) with current code schema
-- and the reference schema in online_exam_system.sql, while preserving existing data.
-- Steps:
--   1) Run in the target database `online_exam_system`.
--   2) Review duplicate checks before adding unique keys.
--   3) Apply ALTERs, then recreate views/triggers.

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

USE `online_exam_system`;

-- ------------------------------------------------------------
-- Optional sanity checks (run manually before applying uniques)
-- ------------------------------------------------------------
-- SELECT username, COUNT(*) c FROM user GROUP BY username HAVING c > 1;
-- SELECT phone_number, COUNT(*) c FROM user GROUP BY phone_number HAVING phone_number IS NOT NULL AND c > 1;
-- SELECT email, COUNT(*) c FROM user GROUP BY email HAVING email IS NOT NULL AND c > 1;
-- SELECT exam_id, student_id, COUNT(*) c FROM exam_participant GROUP BY exam_id, student_id HAVING c > 1;
-- SELECT exam_id, student_id, COUNT(*) c FROM score_record GROUP BY exam_id, student_id HAVING c > 1;
-- SELECT exam_id, student_id, question_id, COUNT(*) c FROM student_answer GROUP BY exam_id, student_id, question_id HAVING c > 1;

-- ------------------------------------------------------------
-- user table: add fields used by mappers and relax status to match code
-- ------------------------------------------------------------
ALTER TABLE `user`
    CHANGE COLUMN `phone` `phone_number` VARCHAR(20) NULL DEFAULT NULL COMMENT 'phone number',
    ADD COLUMN IF NOT EXISTS `user_role` VARCHAR(50) NOT NULL DEFAULT 'Student' COMMENT '缓存字段：来源 user_role 表的主角色' AFTER `phone_number`,
    ADD COLUMN IF NOT EXISTS `extra_info` JSON NULL AFTER `status`,
    MODIFY COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'Active' COMMENT 'Active/Locked';

-- Bring existing status values to the expected set
UPDATE `user` SET `status` = 'Locked' WHERE `status` = 'Inactive';
-- Seed user_role from existing role mapping when missing
UPDATE `user` u
LEFT JOIN `user_role` ur ON u.user_id = ur.user_id
LEFT JOIN `role` r ON ur.role_id = r.role_id
SET u.user_role = COALESCE(r.role_name, u.user_role, 'Student')
WHERE u.user_role IS NULL OR u.user_role = '';

-- Backfill user_role 表关联（若缺失则按 user.user_role 绑定；若查不到对应角色则默认 Student）
INSERT IGNORE INTO user_role (user_id, role_id)
SELECT u.user_id, COALESCE(r.role_id, r2.role_id)
FROM user u
LEFT JOIN role r ON r.role_name = u.user_role
LEFT JOIN role r2 ON r2.role_name = 'Student'
LEFT JOIN user_role ur ON ur.user_id = u.user_id AND ur.role_id = COALESCE(r.role_id, r2.role_id)
WHERE ur.user_id IS NULL;

-- ------------------------------------------------------------
-- user_role table: keep pair unique (one row per user-role)
-- ------------------------------------------------------------
ALTER TABLE `user_role`
    ADD UNIQUE KEY `uk_user_role` (`user_id`, `role_id`);

-- ------------------------------------------------------------
-- tag table: add audit columns expected by mapper
-- ------------------------------------------------------------
ALTER TABLE `tag`
    ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `extra_info`,
    ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- ------------------------------------------------------------
-- question table: align with code (difficulty, is_active, audit fields, flexible type)
-- ------------------------------------------------------------
ALTER TABLE `question`
    MODIFY COLUMN `question_type` VARCHAR(50) NOT NULL COMMENT 'question type',
    ADD COLUMN IF NOT EXISTS `difficulty` VARCHAR(32) NOT NULL DEFAULT 'medium' COMMENT 'difficulty level' AFTER `question_type`,
    ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=active,0=disabled' AFTER `default_score`,
    ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `extra_info`,
    ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- ------------------------------------------------------------
-- question_tag: avoid duplicates
-- ------------------------------------------------------------
ALTER TABLE `question_tag`
    ADD UNIQUE KEY `uk_question_tag` (`question_id`, `tag_id`);

-- ------------------------------------------------------------
-- paper table: add draft + audit columns
-- ------------------------------------------------------------
ALTER TABLE `paper`
    ADD COLUMN IF NOT EXISTS `is_draft` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=draft' AFTER `total_score`,
    ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `extra_info`,
    ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- ------------------------------------------------------------
-- paper_question: optional uniqueness on paper/question pairing
-- ------------------------------------------------------------
ALTER TABLE `paper_question`
    ADD UNIQUE KEY `uk_paper_question` (`paper_id`, `question_id`);

-- ------------------------------------------------------------
-- exam table: add fields used by reference views
-- ------------------------------------------------------------
ALTER TABLE `exam`
    ADD COLUMN IF NOT EXISTS `end_time` DATETIME NULL AFTER `start_time`,
    ADD COLUMN IF NOT EXISTS `proctor_id` BIGINT UNSIGNED NULL AFTER `duration_minutes`,
    ADD COLUMN IF NOT EXISTS `status` VARCHAR(20) NOT NULL DEFAULT 'Pending' COMMENT 'Pending/Active/Finished/Canceled' AFTER `proctor_id`,
    ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `status`,
    ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
    ADD COLUMN IF NOT EXISTS `extra_info` JSON NULL AFTER `anti_cheat_settings`;
CREATE INDEX IF NOT EXISTS `idx_exam_proctor_id` ON `exam` (`proctor_id`);
ALTER TABLE `exam`
    ADD CONSTRAINT `fk_exam_proctor` FOREIGN KEY (`proctor_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- exam_participant table: status flexibility + timing fields + uniqueness
-- ------------------------------------------------------------
ALTER TABLE `exam_participant`
    MODIFY COLUMN `join_status` VARCHAR(20) NOT NULL DEFAULT 'Invited' COMMENT 'Invited/Joined/Submitted/Absent',
    ADD COLUMN IF NOT EXISTS `join_time` DATETIME NULL AFTER `join_status`,
    ADD COLUMN IF NOT EXISTS `submit_time` DATETIME NULL AFTER `join_time`,
    ADD UNIQUE KEY `uk_exam_student` (`exam_id`, `student_id`);

-- ------------------------------------------------------------
-- score_record table: align with trigger/view expectations
-- ------------------------------------------------------------
ALTER TABLE `score_record`
    ADD COLUMN IF NOT EXISTS `paper_id` BIGINT UNSIGNED NULL AFTER `exam_id`,
    ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `ranking`,
    ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
    ADD COLUMN IF NOT EXISTS `extra_info` JSON NULL AFTER `updated_at`;
-- Backfill paper_id from exam
UPDATE `score_record` sr
JOIN `exam` e ON sr.exam_id = e.exam_id
SET sr.paper_id = e.paper_id
WHERE sr.paper_id IS NULL;
ALTER TABLE `score_record`
    MODIFY COLUMN `paper_id` BIGINT UNSIGNED NOT NULL,
    ADD UNIQUE KEY `uk_score_exam_student` (`exam_id`, `student_id`),
    ADD CONSTRAINT `fk_sr_paper` FOREIGN KEY (`paper_id`) REFERENCES `paper` (`paper_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- student_answer table: grading info + deduplication
-- ------------------------------------------------------------
ALTER TABLE `student_answer`
    ADD COLUMN IF NOT EXISTS `grader_id` BIGINT UNSIGNED NULL AFTER `obtained_score`,
    ADD COLUMN IF NOT EXISTS `grade_time` DATETIME NULL AFTER `grader_id`,
    MODIFY COLUMN `save_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD UNIQUE KEY `uk_answer_exam_student_question` (`exam_id`, `student_id`, `question_id`),
    ADD CONSTRAINT `fk_sa_grader` FOREIGN KEY (`grader_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- Views recreated from reference schema with current column names
-- ------------------------------------------------------------
DROP VIEW IF EXISTS `v_student_exam_history`;
CREATE VIEW `v_student_exam_history` AS
SELECT
    ep.student_id,
    u.real_name AS student_name,
    e.exam_id,
    e.exam_name,
    e.start_time,
    e.end_time,
    p.paper_name,
    p.total_score AS paper_total_score,
    sr.total_score AS student_obtained_score,
    sr.is_final,
    ep.join_status
FROM exam_participant ep
JOIN exam e ON ep.exam_id = e.exam_id
JOIN paper p ON e.paper_id = p.paper_id
JOIN `user` u ON ep.student_id = u.user_id
LEFT JOIN score_record sr ON ep.exam_id = sr.exam_id AND ep.student_id = sr.student_id
ORDER BY e.start_time DESC;

DROP VIEW IF EXISTS `v_teacher_question_summary`;
CREATE VIEW `v_teacher_question_summary` AS
SELECT
    q.question_id,
    q.creator_id,
    u.real_name AS creator_name,
    q.question_type,
    q.difficulty,
    q.content,
    q.default_score,
    q.is_active,
    GROUP_CONCAT(t.tag_name ORDER BY t.tag_name ASC SEPARATOR '; ') AS tags_list
FROM question q
JOIN `user` u ON q.creator_id = u.user_id
LEFT JOIN question_tag qt ON q.question_id = qt.question_id
LEFT JOIN tag t ON qt.tag_id = t.tag_id
GROUP BY q.question_id, q.creator_id, u.real_name, q.question_type, q.difficulty, q.content, q.default_score, q.is_active
ORDER BY q.question_id DESC;

DROP VIEW IF EXISTS `v_ungraded_subjective_answers`;
CREATE VIEW `v_ungraded_subjective_answers` AS
SELECT
    sa.answer_id,
    sa.exam_id,
    e.exam_name,
    sa.student_id,
    u.real_name AS student_name,
    sa.question_id,
    q.content AS question_content,
    q.default_score,
    sa.student_response,
    sa.save_time AS last_saved_time
FROM student_answer sa
JOIN question q ON sa.question_id = q.question_id
JOIN exam e ON sa.exam_id = e.exam_id
JOIN `user` u ON sa.student_id = u.user_id
WHERE sa.is_graded = 0
  AND q.question_type IN ('ShortAnswer', 'Programming')
  AND e.status = 'Finished'
ORDER BY e.end_time;

-- ------------------------------------------------------------
-- Triggers to keep paper.total_score and score_record in sync
-- (also sync cached user.user_role 与 user_role 表双向一致)
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_user_insert_default_role`;
DELIMITER ;;
CREATE TRIGGER `trg_user_insert_default_role`
AFTER INSERT ON `user`
FOR EACH ROW
BEGIN
    DECLARE v_role_id INT;
    SELECT role_id INTO v_role_id FROM role WHERE role_name = NEW.user_role LIMIT 1;
    IF v_role_id IS NULL THEN
        SELECT role_id INTO v_role_id FROM role WHERE role_name = 'Student' LIMIT 1;
    END IF;
    IF v_role_id IS NOT NULL THEN
        INSERT IGNORE INTO user_role (user_id, role_id) VALUES (NEW.user_id, v_role_id);
    END IF;
END;;
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_user_update_role_mapping`;
DELIMITER ;;
CREATE TRIGGER `trg_user_update_role_mapping`
AFTER UPDATE ON `user`
FOR EACH ROW
BEGIN
    DECLARE v_role_id INT;
    IF NEW.user_role <> OLD.user_role THEN
        SELECT role_id INTO v_role_id FROM role WHERE role_name = NEW.user_role LIMIT 1;
        IF v_role_id IS NULL THEN
            SELECT role_id INTO v_role_id FROM role WHERE role_name = 'Student' LIMIT 1;
        END IF;
        IF v_role_id IS NOT NULL THEN
            INSERT IGNORE INTO user_role (user_id, role_id) VALUES (NEW.user_id, v_role_id);
        END IF;
    END IF;
END;;
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_user_role_insert`;
DELIMITER ;;
CREATE TRIGGER `trg_user_role_insert`
AFTER INSERT ON `user_role`
FOR EACH ROW
BEGIN
    UPDATE `user` u
    JOIN `role` r ON r.role_id = NEW.role_id
    SET u.user_role = r.role_name
    WHERE u.user_id = NEW.user_id;
END;;
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_user_role_update`;
DELIMITER ;;
CREATE TRIGGER `trg_user_role_update`
AFTER UPDATE ON `user_role`
FOR EACH ROW
BEGIN
    UPDATE `user` u
    JOIN `role` r ON r.role_id = NEW.role_id
    SET u.user_role = r.role_name
    WHERE u.user_id = NEW.user_id;
END;;
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_user_role_delete`;
DELIMITER ;;
CREATE TRIGGER `trg_user_role_delete`
AFTER DELETE ON `user_role`
FOR EACH ROW
BEGIN
    DECLARE v_role_name VARCHAR(50);
    SELECT r.role_name
    INTO v_role_name
    FROM user_role ur
    JOIN role r ON ur.role_id = r.role_id
    WHERE ur.user_id = OLD.user_id
    ORDER BY r.role_id
    LIMIT 1;

    UPDATE `user`
    SET user_role = COALESCE(v_role_name, 'Student')
    WHERE user_id = OLD.user_id;
END;;
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_paper_total_score_insert`;
DELIMITER ;;
CREATE TRIGGER `trg_paper_total_score_insert`
AFTER INSERT ON `paper_question`
FOR EACH ROW
BEGIN
    UPDATE paper p
    SET p.total_score = (
        SELECT COALESCE(SUM(question_score), 0)
        FROM paper_question
        WHERE paper_id = NEW.paper_id
    )
    WHERE p.paper_id = NEW.paper_id;
END;;
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_paper_total_score_update`;
DELIMITER ;;
CREATE TRIGGER `trg_paper_total_score_update`
AFTER UPDATE ON `paper_question`
FOR EACH ROW
BEGIN
    IF OLD.question_score <> NEW.question_score OR OLD.paper_id <> NEW.paper_id THEN
        IF OLD.paper_id <> NEW.paper_id THEN
            UPDATE paper p
            SET p.total_score = (
                SELECT COALESCE(SUM(question_score), 0)
                FROM paper_question
                WHERE paper_id = OLD.paper_id
            )
            WHERE p.paper_id = OLD.paper_id;
        END IF;

        UPDATE paper p
        SET p.total_score = (
            SELECT COALESCE(SUM(question_score), 0)
            FROM paper_question
            WHERE paper_id = NEW.paper_id
        )
        WHERE p.paper_id = NEW.paper_id;
    END IF;
END;;
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_paper_total_score_delete`;
DELIMITER ;;
CREATE TRIGGER `trg_paper_total_score_delete`
AFTER DELETE ON `paper_question`
FOR EACH ROW
BEGIN
    UPDATE paper p
    SET p.total_score = (
        SELECT COALESCE(SUM(question_score), 0)
        FROM paper_question
        WHERE paper_id = OLD.paper_id
    )
    WHERE p.paper_id = OLD.paper_id;
END;;
DELIMITER ;

DROP TRIGGER IF EXISTS `trg_update_score_record_on_grade`;
DELIMITER ;;
CREATE TRIGGER `trg_update_score_record_on_grade`
AFTER UPDATE ON `student_answer`
FOR EACH ROW
BEGIN
    DECLARE v_total_score DECIMAL(7, 2);
    DECLARE v_total_questions INT;
    DECLARE v_graded_questions INT;

    IF (OLD.obtained_score <> NEW.obtained_score) OR (OLD.is_graded = 0 AND NEW.is_graded = 1) THEN
        SELECT SUM(obtained_score) INTO v_total_score
        FROM student_answer
        WHERE exam_id = NEW.exam_id AND student_id = NEW.student_id;

        SELECT COUNT(pq.question_id), SUM(CASE WHEN sa.is_graded = 1 THEN 1 ELSE 0 END)
        INTO v_total_questions, v_graded_questions
        FROM paper_question pq
        JOIN exam e ON pq.paper_id = e.paper_id
        LEFT JOIN student_answer sa ON sa.exam_id = NEW.exam_id AND sa.student_id = NEW.student_id AND sa.question_id = pq.question_id
        WHERE e.exam_id = NEW.exam_id;

        INSERT INTO score_record (exam_id, student_id, paper_id, total_score, is_final)
        VALUES (NEW.exam_id, NEW.student_id, (SELECT paper_id FROM exam WHERE exam_id = NEW.exam_id), v_total_score, (v_total_questions = v_graded_questions))
        ON DUPLICATE KEY UPDATE
            total_score = v_total_score,
            is_final = (v_total_questions = v_graded_questions),
            updated_at = CURRENT_TIMESTAMP;
    END IF;
END;;
DELIMITER ;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
