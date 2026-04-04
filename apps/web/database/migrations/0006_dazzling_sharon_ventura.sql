CREATE TABLE `document` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`company_id` integer NOT NULL,
	`document_type` text NOT NULL,
	`data_json` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`exported_at` text,
	`export_format` text,
	`r2_key` text,
	FOREIGN KEY (`template_id`) REFERENCES `document_template`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`document_id` integer NOT NULL,
	`action` text NOT NULL,
	`actor_email` text NOT NULL,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `document`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `document_template` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`schema_json` text NOT NULL,
	`stamp_image_key` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
