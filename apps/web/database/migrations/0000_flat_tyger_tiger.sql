CREATE TABLE `item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`typeId` integer NOT NULL,
	`priceInputVATFree` integer NOT NULL,
	`priceOutputVATFree` integer NOT NULL,
	`priceRetailInclVAT` integer NOT NULL,
	FOREIGN KEY (`typeId`) REFERENCES `item_type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_name_unique` ON `item` (`name`);--> statement-breakpoint
CREATE TABLE `item_type` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_type_name_unique` ON `item_type` (`name`);--> statement-breakpoint
CREATE TABLE `unit` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unit_name_unique` ON `unit` (`name`);