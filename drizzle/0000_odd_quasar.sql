CREATE TABLE `ai_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saved_items` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE INDEX `idx_saved_owner_kind` ON `saved_items` (`user_id`,`kind`,`updated_at`);--> statement-breakpoint
CREATE TABLE `source_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`proposed_by` text NOT NULL,
	`reviewed_by` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
