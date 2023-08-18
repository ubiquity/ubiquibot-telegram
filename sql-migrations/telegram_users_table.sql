CREATE TABLE telegram_users (
  user_id VARCHAR(255) PRIMARY KEY,
  github_id TEXT,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
);