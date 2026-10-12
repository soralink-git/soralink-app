CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `profiles` ADD `email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `state` text DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `plan` text DEFAULT 'Digital' NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `expires` text;--> statement-breakpoint
ALTER TABLE `profiles` ADD `pro_enabled` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `requests` ADD `email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `requests` ADD `service` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `requests` ADD `duration` integer DEFAULT 30 NOT NULL;