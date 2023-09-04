CREATE TABLE tele_git_users_maps (
  user_id TEXT,
  group_id TEXT,
  github_id TEXT,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  CONSTRAINT pk_tele_git_users_maps PRIMARY KEY (group_id, user_id)
);