import {sqliteTable,text,integer,uniqueIndex,index} from 'drizzle-orm/sqlite-core';
export const previewReceipts=sqliteTable('preview_receipts',{
 tokenHash:text('token_hash').primaryKey(),
 receiptId:text('receipt_id').notNull(),
 receivedAt:text('received_at').notNull(),
 context:text('context').notNull(),
 fingerprint:text('fingerprint').notNull(),
 summary:text('summary').notNull(),
});
export const masterProducts=sqliteTable('master_products',{
 id:text('id').primaryKey(),sourceKey:text('source_key').notNull().unique(),title:text('title').notNull(),category:text('category').notNull(),state:text('state').notNull(),revision:integer('revision').notNull(),planningSlot:text('planning_slot'),data:text('data_json').notNull(),updatedAt:text('updated_at').notNull(),
});
export const masterFitments=sqliteTable('master_fitments',{
 id:text('id').primaryKey(),productId:text('product_id').notNull().references(()=>masterProducts.id),vehicleKey:text('vehicle_key').notNull(),state:text('state').notNull(),evidence:text('evidence').notNull(),actor:text('actor').notNull(),createdAt:text('created_at').notNull(),productRevision:integer('product_revision').notNull().default(0),
},t=>[uniqueIndex('fitment_product_vehicle').on(t.productId,t.vehicleKey)]);
export const inventorySources=sqliteTable('inventory_sources',{
 id:text('id').primaryKey(),sourceKey:text('source_key').notNull().unique(),productKey:text('product_key').notNull(),location:text('location').notNull(),data:text('data_json').notNull(),importedAt:text('imported_at').notNull(),
});
export const inventoryMovements=sqliteTable('inventory_movements',{
 id:text('id').primaryKey(),eventKey:text('event_key').notNull().unique(),fingerprint:text('fingerprint').notNull(),productId:text('product_id').notNull().references(()=>masterProducts.id),location:text('location').notNull(),kind:text('kind').notNull(),onhandDelta:integer('onhand_delta').notNull(),reservedDelta:integer('reserved_delta').notNull(),reference:text('reference').notNull(),actor:text('actor').notNull(),reason:text('reason').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('inventory_product_location').on(t.productId,t.location)]);
export const masterAudit=sqliteTable('master_audit',{
 id:text('id').primaryKey(),subjectId:text('subject_id').notNull(),action:text('action').notNull(),actor:text('actor').notNull(),payload:text('payload').notNull(),createdAt:text('created_at').notNull(),
});
export const buildVersions=sqliteTable('build_versions',{
 id:text('id').primaryKey(),buildId:text('build_id').notNull(),version:integer('version').notNull(),parentId:text('parent_id'),keyHash:text('key_hash').notNull().unique(),accessHash:text('access_hash').notNull(),fingerprint:text('fingerprint').notNull(),config:text('config_json').notNull(),estimate:text('estimate_json').notNull(),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('build_version_number').on(t.buildId,t.version)]);
