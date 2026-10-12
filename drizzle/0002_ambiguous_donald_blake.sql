CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`profile` text NOT NULL,
	`request_id` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`next_attempt` text NOT NULL,
	`sent_at` text,
	`provider_id` text,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `notifications_pending` ON `notifications` (`state`,`next_attempt`);--> statement-breakpoint
CREATE INDEX `notifications_profile` ON `notifications` (`profile`,`created`);--> statement-breakpoint
ALTER TABLE `requests` ADD `notification_revision` integer DEFAULT 0 NOT NULL;