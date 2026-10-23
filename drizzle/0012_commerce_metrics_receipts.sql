CREATE TABLE IF NOT EXISTS catalog_order_intents (
  id TEXT PRIMARY KEY NOT NULL,
  profile TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS catalog_intents_profile_created ON catalog_order_intents(profile,created);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS catalog_intents_visitor_created ON catalog_order_intents(visitor_hash,created);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS profile_metrics (
  profile TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('qr','nfc','direct')),
  visits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(profile,day,source)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS profile_metric_seen (
  id TEXT PRIMARY KEY NOT NULL,
  profile TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS metric_seen_created ON profile_metric_seen(created);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS payment_receipts (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  created TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS receipts_order_created ON payment_receipts(order_id,created);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS receipts_owner_created ON payment_receipts(owner,created);
