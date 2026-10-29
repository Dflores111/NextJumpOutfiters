--> statement-breakpoint
CREATE TABLE `package_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`package_id` text NOT NULL,
	`revision` integer NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`state` text NOT NULL,
	`data_json` text NOT NULL,
	`action` text NOT NULL,
	`actor` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`package_id`) REFERENCES `curated_packages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `package_version_revision` ON `package_versions` (`package_id`,`revision`);
--> statement-breakpoint
INSERT OR IGNORE INTO package_versions (id,package_id,revision,title,category,state,data_json,action,actor,created_at)
SELECT id,package_id,revision,title,category,'PUBLISHED',data_json,'PACKAGE_PUBLISHED',published_by,published_at FROM package_releases;
--> statement-breakpoint
INSERT OR IGNORE INTO package_versions (id,package_id,revision,title,category,state,data_json,action,actor,created_at)
SELECT id||':'||revision,id,revision,title,category,state,data_json,'EXISTING_RECORD',NULL,updated_at FROM curated_packages;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `package_version_insert` AFTER INSERT ON curated_packages 
BEGIN
 INSERT INTO package_versions (id,package_id,revision,title,category,state,data_json,action,actor,created_at)
 SELECT NEW.id||':'||NEW.revision,NEW.id,NEW.revision,NEW.title,NEW.category,NEW.state,NEW.data_json,
 COALESCE((SELECT action FROM master_audit WHERE subject_id=NEW.id AND created_at=NEW.updated_at ORDER BY id DESC LIMIT 1),'SAVED_RECORD'),
 (SELECT actor FROM master_audit WHERE subject_id=NEW.id AND created_at=NEW.updated_at ORDER BY id DESC LIMIT 1),NEW.updated_at;
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `package_version_update` AFTER UPDATE ON curated_packages WHEN NEW.revision > OLD.revision
BEGIN
 INSERT INTO package_versions (id,package_id,revision,title,category,state,data_json,action,actor,created_at)
 SELECT NEW.id||':'||NEW.revision,NEW.id,NEW.revision,NEW.title,NEW.category,NEW.state,NEW.data_json,
 COALESCE((SELECT action FROM master_audit WHERE subject_id=NEW.id AND created_at=NEW.updated_at ORDER BY id DESC LIMIT 1),'SAVED_RECORD'),
 (SELECT actor FROM master_audit WHERE subject_id=NEW.id AND created_at=NEW.updated_at ORDER BY id DESC LIMIT 1),NEW.updated_at;
END;
--> statement-breakpoint
