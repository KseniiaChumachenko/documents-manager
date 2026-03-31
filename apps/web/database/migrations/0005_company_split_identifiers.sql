PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_company` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`egrpou` text(8),
	`ik` text(10),
	`entity_type` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`name_short` text,
	`address` text,
	`phone` text,
	`director` text,
	`director_gen` text,
	`kved` text,
	`kved_number` text,
	`inn` text,
	`inn_date` text,
	`last_sync` text,
	FOREIGN KEY (`type`) REFERENCES `company_type`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_company`("egrpou", "entity_type", "type", "name", "name_short", "address", "director", "director_gen", "kved", "kved_number", "inn", "inn_date", "last_sync")
SELECT CAST("egrpou" AS text), 'legal', "type", "name", "name_short", "address", "director", "director_gen", "kved", "kved_number", "inn", "inn_date", "last_update"
FROM `company`;
--> statement-breakpoint
DROP TABLE `company`;--> statement-breakpoint
ALTER TABLE `__new_company` RENAME TO `company`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `company_egrpou_unique` ON `company` (`egrpou`);--> statement-breakpoint
CREATE UNIQUE INDEX `company_ik_unique` ON `company` (`ik`);
