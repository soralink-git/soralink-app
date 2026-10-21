ALTER TABLE orders ADD COLUMN kind TEXT NOT NULL DEFAULT 'purchase';
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN amount INTEGER;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN applied TEXT;
--> statement-breakpoint
