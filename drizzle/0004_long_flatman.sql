CREATE TABLE `product_barcodes` (
	`code` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `master_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `barcode_product` ON `product_barcodes` (`product_id`);--> statement-breakpoint
CREATE TABLE `purchase_order_lines` (
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`received` integer DEFAULT 0 NOT NULL,
	`unit_cost_cents` integer,
	FOREIGN KEY (`order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `master_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_order_product` ON `purchase_order_lines` (`order_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`supplier` text NOT NULL,
	`location` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer NOT NULL,
	`expected_on` text,
	`notes` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_number_unique` ON `purchase_orders` (`number`);--> statement-breakpoint
CREATE INDEX `purchase_status_location` ON `purchase_orders` (`status`,`location`);--> statement-breakpoint
CREATE TABLE `stock_job_lines` (
	`job_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`used` integer,
	FOREIGN KEY (`job_id`) REFERENCES `stock_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `master_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_job_product` ON `stock_job_lines` (`job_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `stock_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`title` text NOT NULL,
	`vehicle` text NOT NULL,
	`location` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer NOT NULL,
	`notes` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stock_jobs_number_unique` ON `stock_jobs` (`number`);--> statement-breakpoint
CREATE INDEX `job_status_location` ON `stock_jobs` (`status`,`location`);