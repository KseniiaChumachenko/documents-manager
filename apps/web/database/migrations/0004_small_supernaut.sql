PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_company` (
	`egrpou` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
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
	FOREIGN KEY (`type`) REFERENCES `company_type`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_company`("egrpou", "type", "name", "name_short", "address", "director", "director_gen", "kved", "kved_number", "inn", "inn_date", "last_update") SELECT "egrpou", "type", "name", "name_short", "address", "director", "director_gen", "kved", "kved_number", "inn", "inn_date", "last_update" FROM `company`;--> statement-breakpoint
DROP TABLE `company`;--> statement-breakpoint
ALTER TABLE `__new_company` RENAME TO `company`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `company_name_unique` ON `company` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `company_name_short_unique` ON `company` (`name_short`);--> statement-breakpoint
CREATE TABLE `__new_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`unit` text,
	`priceInputVATFree` integer NOT NULL,
	`priceOutputVATFree` integer NOT NULL,
	`priceRetailInclVAT` integer NOT NULL,
	FOREIGN KEY (`type`) REFERENCES `item_type`(`name`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`unit`) REFERENCES `unit`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_item`("id", "name", "type", "unit", "priceInputVATFree", "priceOutputVATFree", "priceRetailInclVAT") SELECT "id", "name", "type", "unit", "priceInputVATFree", "priceOutputVATFree", "priceRetailInclVAT" FROM `item`;--> statement-breakpoint
DROP TABLE `item`;--> statement-breakpoint
ALTER TABLE `__new_item` RENAME TO `item`;--> statement-breakpoint
CREATE UNIQUE INDEX `item_name_unique` ON `item` (`name`);