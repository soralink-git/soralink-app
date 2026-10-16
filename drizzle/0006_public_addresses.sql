CREATE TABLE IF NOT EXISTS `profile_addresses` (
  `name` text PRIMARY KEY NOT NULL,
  `profile` text NOT NULL REFERENCES `profiles` (`id`),
  `is_current` integer DEFAULT 1 NOT NULL CHECK (`is_current` IN (0,1)),
  `created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `profile_current_address` ON `profile_addresses` (`profile`) WHERE `is_current`=1;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `profile_address_history` ON `profile_addresses` (`profile`);
