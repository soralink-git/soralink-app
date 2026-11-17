-- Preserve card identity across primary/secondary cards for address, order and metric FKs.
CREATE TABLE card_registry (id TEXT PRIMARY KEY NOT NULL);
--> statement-breakpoint
INSERT INTO card_registry(id) SELECT id FROM profiles UNION SELECT id FROM secondary_cards;
--> statement-breakpoint
CREATE TRIGGER profiles_registry_insert AFTER INSERT ON profiles BEGIN
  INSERT INTO card_registry(id) VALUES(NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER profiles_registry_delete AFTER DELETE ON profiles BEGIN
  DELETE FROM card_registry WHERE id=OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER secondary_registry_insert AFTER INSERT ON secondary_cards BEGIN
  INSERT INTO card_registry(id) VALUES(NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER secondary_registry_delete AFTER DELETE ON secondary_cards BEGIN
  DELETE FROM card_registry WHERE id=OLD.id;
END;
--> statement-breakpoint
CREATE TABLE profile_addresses_next (
  name TEXT PRIMARY KEY NOT NULL,
  profile TEXT NOT NULL REFERENCES card_registry(id),
  is_current INTEGER NOT NULL DEFAULT 1 CHECK(is_current IN (0,1)),
  created TEXT NOT NULL
);
--> statement-breakpoint
INSERT INTO profile_addresses_next SELECT * FROM profile_addresses;
--> statement-breakpoint
DROP TABLE profile_addresses;
--> statement-breakpoint
ALTER TABLE profile_addresses_next RENAME TO profile_addresses;
--> statement-breakpoint
CREATE UNIQUE INDEX profile_current_address ON profile_addresses(profile) WHERE is_current=1;
--> statement-breakpoint
CREATE INDEX profile_address_history ON profile_addresses(profile);
--> statement-breakpoint
CREATE TABLE catalog_order_intents_next (
  id TEXT PRIMARY KEY NOT NULL,
  profile TEXT NOT NULL REFERENCES card_registry(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created TEXT NOT NULL
);
--> statement-breakpoint
INSERT INTO catalog_order_intents_next SELECT * FROM catalog_order_intents;
--> statement-breakpoint
DROP TABLE catalog_order_intents;
--> statement-breakpoint
ALTER TABLE catalog_order_intents_next RENAME TO catalog_order_intents;
--> statement-breakpoint
CREATE INDEX catalog_intents_profile_created ON catalog_order_intents(profile,created);
--> statement-breakpoint
CREATE INDEX catalog_intents_visitor_created ON catalog_order_intents(visitor_hash,created);
--> statement-breakpoint
CREATE TABLE profile_metrics_next (
  profile TEXT NOT NULL REFERENCES card_registry(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('qr','nfc','direct')),
  visits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(profile,day,source)
);
--> statement-breakpoint
INSERT INTO profile_metrics_next SELECT * FROM profile_metrics;
--> statement-breakpoint
DROP TABLE profile_metrics;
--> statement-breakpoint
ALTER TABLE profile_metrics_next RENAME TO profile_metrics;
--> statement-breakpoint
CREATE TABLE profile_metric_seen_next (
  id TEXT PRIMARY KEY NOT NULL,
  profile TEXT NOT NULL REFERENCES card_registry(id) ON DELETE CASCADE,
  created TEXT NOT NULL
);
--> statement-breakpoint
INSERT INTO profile_metric_seen_next SELECT * FROM profile_metric_seen;
--> statement-breakpoint
DROP TABLE profile_metric_seen;
--> statement-breakpoint
ALTER TABLE profile_metric_seen_next RENAME TO profile_metric_seen;
--> statement-breakpoint
CREATE INDEX metric_seen_created ON profile_metric_seen(created);
