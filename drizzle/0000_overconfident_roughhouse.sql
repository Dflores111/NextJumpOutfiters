CREATE TABLE `preview_receipts` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`receipt_id` text NOT NULL,
	`received_at` text NOT NULL,
	`context` text NOT NULL,
	`fingerprint` text NOT NULL,
	`summary` text NOT NULL
);
