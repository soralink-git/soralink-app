CREATE TABLE IF NOT EXISTS app_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  owner TEXT NOT NULL,
  expires INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS app_sessions_expiry ON app_sessions(expires);
