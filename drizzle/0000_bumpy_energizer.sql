CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`is_default` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_user_name` ON `activity` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `availability` (
	`id` text PRIMARY KEY NOT NULL,
	`friend_id` text NOT NULL,
	`label` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`friend_id`) REFERENCES `friend`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `closeness_tier` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer NOT NULL,
	`color` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `closeness_tier_user_sort` ON `closeness_tier` (`user_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`activity_id` text,
	`date` text,
	`time` text,
	`location` text,
	`capacity` integer,
	`vibe` text,
	`status` text DEFAULT 'planning' NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `event_invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`friend_id` text NOT NULL,
	`status` text DEFAULT 'not_invited' NOT NULL,
	`attended` integer,
	`must_invite` integer DEFAULT false NOT NULL,
	`must_exclude` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`friend_id`) REFERENCES `friend`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_invitation_unique` ON `event_invitation` (`event_id`,`friend_id`);--> statement-breakpoint
CREATE TABLE `friend` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`photo` text,
	`phone` text,
	`email` text,
	`social_handles` text,
	`birthday` text,
	`location` text,
	`love_language` text,
	`favorite_food` text,
	`dietary_restrictions` text,
	`employer` text,
	`occupation` text,
	`personal_notes` text,
	`care_mode_active` integer DEFAULT false NOT NULL,
	`care_mode_note` text,
	`care_mode_reminder` text,
	`care_mode_started_at` text,
	`closeness_tier_id` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`closeness_tier_id`) REFERENCES `closeness_tier`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `friend_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`friend_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`rating` integer NOT NULL,
	FOREIGN KEY (`friend_id`) REFERENCES `friend`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_activity_unique` ON `friend_activity` (`friend_id`,`activity_id`);--> statement-breakpoint
CREATE TABLE `friend_connection` (
	`id` text PRIMARY KEY NOT NULL,
	`friend_a_id` text NOT NULL,
	`friend_b_id` text NOT NULL,
	`type` text,
	`strength` integer DEFAULT 3 NOT NULL,
	`how_they_met` text,
	`start_date` text,
	`end_date` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`friend_a_id`) REFERENCES `friend`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`friend_b_id`) REFERENCES `friend`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_connection_unique` ON `friend_connection` (`friend_a_id`,`friend_b_id`);--> statement-breakpoint
CREATE TABLE `gift_idea` (
	`id` text PRIMARY KEY NOT NULL,
	`friend_id` text NOT NULL,
	`description` text NOT NULL,
	`url` text,
	`price` text,
	`purchased` integer DEFAULT false NOT NULL,
	`purchased_at` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`friend_id`) REFERENCES `friend`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `note` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`type` text NOT NULL,
	`friend_id` text,
	`event_id` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`friend_id`) REFERENCES `friend`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
