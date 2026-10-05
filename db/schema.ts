import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const previewReceipts=sqliteTable('preview_receipts',{
 tokenHash:text('token_hash').primaryKey(),
 receiptId:text('receipt_id').notNull(),
 receivedAt:text('received_at').notNull(),
 context:text('context').notNull(),
 fingerprint:text('fingerprint').notNull(),
 summary:text('summary').notNull(),
});
