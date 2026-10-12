CREATE TABLE `media_assets` (
	`key` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`bytes` integer NOT NULL,
	`state` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `media_owner_state` ON `media_assets` (`owner`,`state`);