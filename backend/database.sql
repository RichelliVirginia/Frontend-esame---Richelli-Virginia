

CREATE DATABASE IF NOT EXISTS academy_aziendale
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE academy_aziendale;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS course_assignments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('employee', 'academy') NOT NULL DEFAULT 'employee',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    duration_hours DECIMAL(6,1) UNSIGNED NOT NULL,
    is_mandatory TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_course_duration CHECK (duration_hours > 0)
);

CREATE TABLE course_assignments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    employee_id INT UNSIGNED NOT NULL,
    assigned_on DATE NOT NULL,
    due_on DATE NOT NULL,
    status ENUM('assigned', 'completed', 'cancelled') NOT NULL DEFAULT 'assigned',
    completed_on DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignment_course
        FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_assignment_employee
        FOREIGN KEY (employee_id) REFERENCES users(id),
    CONSTRAINT uq_course_employee_date UNIQUE (course_id, employee_id, assigned_on),
    CONSTRAINT chk_assignment_dates CHECK (due_on >= assigned_on),
    CONSTRAINT chk_completion_date CHECK (completed_on IS NULL OR completed_on >= assigned_on)
);

INSERT INTO users (first_name, last_name, email, password, role) VALUES
('Anna', 'Rossi', 'academy@example.com', '$2y$10$f1LYrbUQ6.bDr.pUl13fBuEgb2QTv8oLqn1Nk1Oz1vYU.X8fKHESS', 'academy'),
('Marco', 'Bianchi', 'marco.bianchi@example.com', '$2y$10$Zr9rn7PUGd26sTJ5KJ92KegbTzT5eQK059o.3ZW2Mn57TyOMZK9vK', 'employee'),
('Giulia', 'Verdi', 'giulia.verdi@example.com', '$2y$10$Zr9rn7PUGd26sTJ5KJ92KegbTzT5eQK059o.3ZW2Mn57TyOMZK9vK', 'employee'),
('Luca', 'Neri', 'luca.neri@example.com', '$2y$10$Zr9rn7PUGd26sTJ5KJ92KegbTzT5eQK059o.3ZW2Mn57TyOMZK9vK', 'employee');

INSERT INTO courses
(title, description, category, duration_hours, is_mandatory, is_active) VALUES
('Sicurezza sul lavoro', 'Aggiornamento annuale sulle procedure di sicurezza aziendale.', 'Sicurezza', 8, 1, 1),
('Excel per il reporting', 'Formule, tabelle pivot e creazione di report operativi.', 'Competenze digitali', 12, 0, 1),
('Protezione dei dati', 'Principi GDPR e corretta gestione dei dati personali.', 'Compliance', 4, 1, 1),
('Comunicazione efficace', 'Tecniche di ascolto, feedback e comunicazione nel team.', 'Soft skill', 6, 0, 1),
('Corso legacy', 'Corso storico mantenuto solo per consultare le assegnazioni passate.', 'Competenze digitali', 3, 0, 0);

INSERT INTO course_assignments
(course_id, employee_id, assigned_on, due_on, status, completed_on) VALUES
(1, 2, '2026-05-05', '2026-05-31', 'completed', '2026-05-24'),
(2, 2, '2026-06-01', '2026-07-31', 'assigned', NULL),
(3, 2, '2026-04-10', '2026-04-30', 'assigned', NULL),
(1, 3, '2026-05-08', '2026-06-15', 'completed', '2026-06-10'),
(4, 3, '2026-06-12', '2026-08-10', 'assigned', NULL),
(2, 4, '2026-05-15', '2026-06-30', 'cancelled', NULL),
(5, 4, '2026-03-01', '2026-03-31', 'completed', '2026-03-28');
