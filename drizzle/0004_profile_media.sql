CREATE TABLE IF NOT EXISTS profile_media (
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_key TEXT NOT NULL,
  PRIMARY KEY (profile_id, media_key)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS profile_media_key ON profile_media(media_key);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS profiles_media_insert AFTER INSERT ON profiles
BEGIN
  INSERT OR IGNORE INTO profile_media(profile_id, media_key)
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
CREATE TRIGGER IF NOT EXISTS profiles_media_update AFTER UPDATE OF data ON profiles
WHEN NEW.data IS NOT OLD.data
BEGIN
  DELETE FROM profile_media WHERE profile_id = OLD.id;
  INSERT OR IGNORE INTO profile_media(profile_id, media_key)
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
INSERT OR IGNORE INTO profile_media(profile_id, media_key)
WITH RECURSIVE links(profile_id, rest) AS (
  SELECT p.id, j.atom FROM profiles p, json_tree(p.data) j WHERE j.type = 'text'
  UNION ALL
  SELECT profile_id, substr(rest, instr(rest, '/api/upload?key=') + 52)
  FROM links WHERE instr(rest, '/api/upload?key=') > 0
), candidates(profile_id, media_key) AS (
  SELECT profile_id, substr(rest, instr(rest, '/api/upload?key=') + 16, 36)
  FROM links WHERE instr(rest, '/api/upload?key=') > 0
)
SELECT DISTINCT profile_id, media_key FROM candidates
WHERE length(media_key) = 36
  AND media_key GLOB '????????-????-????-????-????????????'
  AND media_key NOT GLOB '*[^a-f0-9-]*';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS profile_media_ready BEFORE INSERT ON profile_media
WHEN EXISTS (SELECT 1 FROM media_assets WHERE key = NEW.media_key AND state != 'ready')
  AND NOT EXISTS (SELECT 1 FROM profile_media WHERE profile_id = NEW.profile_id AND media_key = NEW.media_key)
BEGIN
  SELECT RAISE(ABORT, 'Referenced media is not ready');
END;
