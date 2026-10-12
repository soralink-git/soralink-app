CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`profile` text NOT NULL,
	`slot` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_slot` ON `bookings` (`profile`,`slot`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`plan` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_owner_unique` ON `profiles` (`owner`);--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`profile` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`message` text NOT NULL,
	`slot` text,
	`status` text DEFAULT 'new' NOT NULL,
	`created` text NOT NULL
);
