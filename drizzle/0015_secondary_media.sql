-- Media references for secondary cards.
-- The profile_media triggers only watch `profiles`; without an equivalent for
-- `secondary_cards`, cleanupMedia treated every secondary-card asset as orphan
-- and deleted it from R2 after 24 h.
CREATE TABLE IF NOT EXISTS secondary_card_media (
  card_id TEXT NOT NULL REFERENCES secondary_cards(id) ON DELETE CASCADE,
  media_key TEXT NOT NULL,
  PRIMARY KEY (card_id, media_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS secondary_card_media_key ON secondary_card_media(media_key);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS secondary_cards_media_insert AFTER INSERT ON secondary_cards
BEGIN
  INSERT OR IGNORE INTO secondary_card_media(card_id, media_key)
  WITH RECURSIVE links(rest) AS (
    SELECT atom FROM json_tree(NEW.data) WHERE type = 'text'
    UNION ALL
    SELECT substr(rest, instr(rest, '/api/upload?key=') + 52)
    FROM links WHERE instr(rest, '/api/upload?key=') > 0
  ), candidates(media_key) AS (
    SELECT substr(rest, instr(rest, '/api/upload?key=') + 16, 36)
    FROM links WHERE instr(rest, '/api/upload?key=') > 0
  )
  SELECT DISTINCT NEW.id, media_key FROM candidates
  WHERE length(media_key) = 36
    AND media_key GLOB '????????-????-????-????-????????????'
    AND media_key NOT GLOB '*[^a-f0-9-]*';
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS secondary_cards_media_update AFTER UPDATE OF data ON secondary_cards
WHEN NEW.data IS NOT OLD.data
BEGIN
  DELETE FROM secondary_card_media WHERE card_id = OLD.id;
  INSERT OR IGNORE INTO secondary_card_media(card_id, media_key)
  WITH RECURSIVE links(rest) AS (
    SELECT atom FROM json_tree(NEW.data) WHERE type = 'text'
    UNION ALL
    SELECT substr(rest, instr(rest, '/api/upload?key=') + 52)
    FROM links WHERE instr(rest, '/api/upload?key=') > 0
  ), candidates(media_key) AS (
    SELECT substr(rest, instr(rest, '/api/upload?key=') + 16, 36)
    FROM links WHERE instr(rest, '/api/upload?key=') > 0
  )
  SELECT DISTINCT NEW.id, media_key FROM candidates
  WHERE length(media_key) = 36
    AND media_key GLOB '????????-????-????-????-????????????'
    AND media_key NOT GLOB '*[^a-f0-9-]*';
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS secondary_cards_media_delete AFTER DELETE ON secondary_cards
BEGIN
  DELETE FROM secondary_card_media WHERE card_id = OLD.id;
END;
--> statement-breakpoint
INSERT OR IGNORE INTO secondary_card_media(card_id, media_key)
WITH RECURSIVE links(card_id, rest) AS (
  SELECT s.id, j.atom FROM secondary_cards s, json_tree(s.data) j WHERE j.type = 'text'
  UNION ALL
  SELECT card_id, substr(rest, instr(rest, '/api/upload?key=') + 52)
  FROM links WHERE instr(rest, '/api/upload?key=') > 0
), candidates(card_id, media_key) AS (
  SELECT card_id, substr(rest, instr(rest, '/api/upload?key=') + 16, 36)
  FROM links WHERE instr(rest, '/api/upload?key=') > 0
)
SELECT DISTINCT card_id, media_key FROM candidates
WHERE length(media_key) = 36
  AND media_key GLOB '????????-????-????-????-????????????'
  AND media_key NOT GLOB '*[^a-f0-9-]*';
