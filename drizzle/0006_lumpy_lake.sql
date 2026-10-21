CREATE TABLE `catalog_source_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`source_key` text NOT NULL,
	`source_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`group_name` text NOT NULL,
	`file` text NOT NULL,
	`sheet` text NOT NULL,
	`row_number` integer NOT NULL,
	`data_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_source_rows_source_key_unique` ON `catalog_source_rows` (`source_key`);--> statement-breakpoint
CREATE INDEX `source_rows_kind_group` ON `catalog_source_rows` (`kind`,`group_name`);