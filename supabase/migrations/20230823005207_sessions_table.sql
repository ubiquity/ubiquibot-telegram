CREATE TABLE sessions (
  key CHAR(20) PRIMARY KEY,
  value JSONB,
  created_at timestamp with time zone
);