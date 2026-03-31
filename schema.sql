CREATE TABLE IF NOT EXISTS students (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS papers (
    id               VARCHAR(100) PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    subject          VARCHAR(100) NOT NULL,
    created_at       DATE NOT NULL,
    total_questions  INT DEFAULT 0,
    duration_minutes INT DEFAULT 60
);

CREATE TABLE IF NOT EXISTS questions (
    id             SERIAL PRIMARY KEY,
    paper_id       VARCHAR(100) NOT NULL,
    qno            INT NOT NULL,
    question_text  TEXT NOT NULL,
    option_a       TEXT NOT NULL,
    option_b       TEXT NOT NULL,
    option_c       TEXT NOT NULL,
    option_d       TEXT NOT NULL,
    correct_option INT NOT NULL,
    difficulty     VARCHAR(30) NOT NULL,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE TABLE results (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(255) NOT NULL,
    paper_id   VARCHAR(100) NOT NULL,
    correct    INT NOT NULL,
    wrong      INT NOT NULL,
    skipped    INT NOT NULL,
    total      INT NOT NULL,
    percentage FLOAT NOT NULL,
    datetime   TIMESTAMP NOT NULL,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE TABLE result_answers (
    id             SERIAL PRIMARY KEY,
    result_id      INT NOT NULL,
    question_no    INT NOT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    student_answer VARCHAR(10) NULL,
    status         VARCHAR(50) NOT NULL,
    FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE
);
