CREATE TABLE IF NOT EXISTS telegram_bot_groups (
    id bigint PRIMARY KEY,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    group_name text,
    from_id bigint,
    github_repo text
)