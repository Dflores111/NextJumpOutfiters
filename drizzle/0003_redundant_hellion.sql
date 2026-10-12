CREATE TABLE `inventory_settings` (
	`product_id` text NOT NULL,
	`location` text NOT NULL,
	`bin` text,
	`min_level` integer,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `master_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_settings_product_location` ON `inventory_settings` (`product_id`,`location`);