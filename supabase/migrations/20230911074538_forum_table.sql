CREATE TABLE IF NOT EXISTS telegram_bot_forums (
    id SERIAL PRIMARY KEY,
    group_id bigint NOT NULL,
    forum_name VARCHAR(255) NOT NULL,
    github_repo VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);