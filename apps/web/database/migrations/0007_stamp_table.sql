CREATE TABLE `stamp` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`image_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `document_template` ADD `stamp_id` integer REFERENCES `stamp`(`id`);
--> statement-breakpoint
ALTER TABLE `document_template` DROP COLUMN `stamp_image_key`;
