CREATE TABLE IF NOT EXISTS sessions (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB,
  created_at timestamp with time zone
);