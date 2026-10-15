ALTER TABLE `requests` ADD `language` text DEFAULT 'fr' NOT NULL;--> statement-breakpoint
CREATE INDEX `requests_profile_created` ON `requests` (`profile`,`created`);--> statement-breakpoint
CREATE INDEX `requests_profile_phone_created` ON `requests` (`profile`,`phone`,`created`);--> statement-breakpoint
CREATE INDEX `orders_owner_created` ON `orders` (`owner`,`created`);
--> statement-breakpoint
-- Existing trials receive a fixed transition period; later saves never extend it.
UPDATE profiles SET expires = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+14 days')
WHERE state = 'trial' AND expires IS NULL;
