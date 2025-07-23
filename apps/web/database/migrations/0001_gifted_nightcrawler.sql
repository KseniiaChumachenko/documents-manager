CREATE TABLE `company` (
	`egrpou` integer PRIMARY KEY NOT NULL,
	`typeId` integer NOT NULL,
	`name` text NOT NULL,
	`name_short` text NOT NULL,
	`address` text NOT NULL,
	`director` text,
	`director_gen` text,
	`kved` text,
	`kved_number` text,
	`inn` text,
	`inn_date` text,
	`last_update` text,
	FOREIGN KEY (`typeId`) REFERENCES `item_type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_name_unique` ON `company` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `company_name_short_unique` ON `company` (`name_short`);--> statement-breakpoint
ALTER TABLE `item` ADD `unitId` integer REFERENCES unit(id);