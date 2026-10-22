CREATE TABLE `job_purchase_orders` (
	`order_id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `stock_jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `job_requirements` (
	`job_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `stock_jobs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `master_products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_requirement_product` ON `job_requirements` (`job_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `quote_job_handoffs` (
	`quote_id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `package_quotes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `stock_jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quote_job_handoffs_job_id_unique` ON `quote_job_handoffs` (`job_id`);