CREATE TABLE `google_contact_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_name` text NOT NULL,
	`display_name` text,
	`email` text,
	`phone` text,
	`address` text,
	`photo_url` text,
	`etag` text,
	`raw_json` text,
	`user_id` text NOT NULL,
	`fetched_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `google_contact_cache_user_resource` ON `google_contact_cache` (`user_id`,`resource_name`);--> statement-breakpoint
CREATE TABLE `user_google_sync` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`google_contacts_sync_token` text,
	`last_bulk_sync_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_google_sync_user_id_unique` ON `user_google_sync` (`user_id`);--> statement-breakpoint
ALTER TABLE `friend` ADD `google_contact_resource_name` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `google_contact_etag` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `last_google_sync_at` text;