CREATE TABLE `build_standards` (
	`id` text PRIMARY KEY NOT NULL,
	`source_key` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer NOT NULL,
	`data_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `build_standards_source_key_unique` ON `build_standards` (`source_key`);--> statement-breakpoint
CREATE TABLE `curated_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`source_key` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer NOT NULL,
	`data_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `curated_packages_source_key_unique` ON `curated_packages` (`source_key`);--> statement-breakpoint
CREATE TABLE `package_quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`package_id` text NOT NULL,
	`package_revision` integer NOT NULL,
	`key_hash` text NOT NULL,
	`access_hash` text NOT NULL,
	`fingerprint` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`package_id`) REFERENCES `curated_packages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `package_quotes_number_unique` ON `package_quotes` (`number`);--> statement-breakpoint
CREATE UNIQUE INDEX `package_quotes_key_hash_unique` ON `package_quotes` (`key_hash`);--> statement-breakpoint
CREATE TABLE `product_supply` (
	`product_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`data_json` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `master_products`(`id`) ON UPDATE no action ON DELETE no action
);
