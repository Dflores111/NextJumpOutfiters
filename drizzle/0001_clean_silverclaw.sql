CREATE TABLE `build_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`build_id` text NOT NULL,
	`version` integer NOT NULL,
	`parent_id` text,
	`key_hash` text NOT NULL,
	`access_hash` text NOT NULL,
	`fingerprint` text NOT NULL,
	`config_json` text NOT NULL,
	`estimate_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `build_versions_key_hash_unique` ON `build_versions` (`key_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `build_version_number` ON `build_versions` (`build_id`,`version`);--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`event_key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`product_id` text NOT NULL,
	`location` text NOT NULL,
	`kind` text NOT NULL,
	`onhand_delta` integer NOT NULL,
	`reserved_delta` integer NOT NULL,
	`reference` text NOT NULL,
	`actor` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `master_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_movements_event_key_unique` ON `inventory_movements` (`event_key`);--> statement-breakpoint
CREATE INDEX `inventory_product_location` ON `inventory_movements` (`product_id`,`location`);--> statement-breakpoint
CREATE TABLE `inventory_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`source_key` text NOT NULL,
	`product_key` text NOT NULL,
	`location` text NOT NULL,
	`data_json` text NOT NULL,
	`imported_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_sources_source_key_unique` ON `inventory_sources` (`source_key`);--> statement-breakpoint
CREATE TABLE `master_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `master_fitments` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`vehicle_key` text NOT NULL,
	`state` text NOT NULL,
	`evidence` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `master_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fitment_product_vehicle` ON `master_fitments` (`product_id`,`vehicle_key`);--> statement-breakpoint
CREATE TABLE `master_products` (
	`id` text PRIMARY KEY NOT NULL,
	`source_key` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer NOT NULL,
	`planning_slot` text,
	`data_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `master_products_source_key_unique` ON `master_products` (`source_key`);