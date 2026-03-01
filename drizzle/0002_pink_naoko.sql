ALTER TABLE `friend` ADD `address` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `address_street` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `address_city` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `address_state` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `address_zip` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `address_country` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `address_lat` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `address_lng` text;--> statement-breakpoint
ALTER TABLE `friend` ADD `address_place_id` text;--> statement-breakpoint
UPDATE `friend` SET `address` = `location` WHERE `location` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `friend` DROP COLUMN `location`;