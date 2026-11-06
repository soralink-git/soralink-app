CREATE TABLE IF NOT EXISTS public_rate_limits (
  key TEXT PRIMARY KEY NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  expires INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS public_rate_limits_expires ON public_rate_limits(expires);
