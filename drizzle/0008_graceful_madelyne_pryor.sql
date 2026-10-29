CREATE TABLE `package_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`package_id` text NOT NULL,
	`revision` integer NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`data_json` text NOT NULL,
	`active` integer NOT NULL,
	`published_by` text NOT NULL,
	`published_at` text NOT NULL,
	FOREIGN KEY (`package_id`) REFERENCES `curated_packages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `package_release_revision` ON `package_releases` (`package_id`,`revision`);--> statement-breakpoint
CREATE INDEX `package_release_active` ON `package_releases` (`package_id`,`active`);
--> statement-breakpoint
INSERT INTO package_releases (id,package_id,revision,title,category,data_json,active,published_by,published_at)
SELECT id||':'||revision,id,revision,title,category,data_json,1,'Existing published package',updated_at FROM curated_packages WHERE state='PUBLISHED';
