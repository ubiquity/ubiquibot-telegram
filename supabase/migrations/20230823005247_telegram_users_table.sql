CREATE TABLE IF NOT EXISTS tele_git_users_maps (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  group_id TEXT,
  github_id TEXT,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);