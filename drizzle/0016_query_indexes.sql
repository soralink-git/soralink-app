-- Indexes for the admin and maintenance queries observed in production plans.
CREATE INDEX IF NOT EXISTS profiles_updated ON profiles(updated);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS audit_created ON audit(created);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS notifications_state_created ON notifications(state, created);
