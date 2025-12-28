CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    task VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE
);

INSERT INTO todos (task, completed) VALUES ('Sample Task 1', false);
INSERT INTO todos (task, completed) VALUES ('Sample Task 2', true);
