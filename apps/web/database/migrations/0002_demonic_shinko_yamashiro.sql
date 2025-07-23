CREATE TABLE `company_type` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_type_name_unique` ON `company_type` (`name`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_company` (
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
	FOREIGN KEY (`typeId`) REFERENCES `company_type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_company`("egrpou", "typeId", "name", "name_short", "address", "director", "director_gen", "kved", "kved_number", "inn", "inn_date", "last_update") SELECT "egrpou", "typeId", "name", "name_short", "address", "director", "director_gen", "kved", "kved_number", "inn", "inn_date", "last_update" FROM `company`;--> statement-breakpoint
DROP TABLE `company`;--> statement-breakpoint
ALTER TABLE `__new_company` RENAME TO `company`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `company_name_unique` ON `company` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `company_name_short_unique` ON `company` (`name_short`);