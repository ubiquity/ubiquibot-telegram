CREATE TABLE telegram_bot_groups (
    id bigint,
    created_at timestamp with time zone,
    group_name text,
    from_id bigint,
    github_repo text
)

ALTER TABLE telegram_bot_groups ENABLE ROW LEVEL SECURITY