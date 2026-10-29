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
export const inventorySettings=sqliteTable('inventory_settings',{
 productId:text('product_id').notNull().references(()=>masterProducts.id),location:text('location').notNull(),bin:text('bin'),minLevel:integer('min_level'),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[uniqueIndex('inventory_settings_product_location').on(t.productId,t.location)]);
export const productBarcodes=sqliteTable('product_barcodes',{
 code:text('code').primaryKey(),productId:text('product_id').notNull().references(()=>masterProducts.id),createdBy:text('created_by').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('barcode_product').on(t.productId)]);
export const purchaseOrders=sqliteTable('purchase_orders',{
 id:text('id').primaryKey(),number:text('number').notNull().unique(),supplier:text('supplier').notNull(),location:text('location').notNull(),status:text('status').notNull(),revision:integer('revision').notNull(),expectedOn:text('expected_on'),notes:text('notes').notNull(),createdBy:text('created_by').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[index('purchase_status_location').on(t.status,t.location)]);
export const purchaseOrderLines=sqliteTable('purchase_order_lines',{
 orderId:text('order_id').notNull().references(()=>purchaseOrders.id),productId:text('product_id').notNull().references(()=>masterProducts.id),quantity:integer('quantity').notNull(),received:integer('received').notNull().default(0),unitCostCents:integer('unit_cost_cents'),
},t=>[uniqueIndex('purchase_order_product').on(t.orderId,t.productId)]);
export const stockJobs=sqliteTable('stock_jobs',{
 id:text('id').primaryKey(),number:text('number').notNull().unique(),title:text('title').notNull(),vehicle:text('vehicle').notNull(),location:text('location').notNull(),status:text('status').notNull(),revision:integer('revision').notNull(),notes:text('notes').notNull(),createdBy:text('created_by').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[index('job_status_location').on(t.status,t.location)]);
export const stockJobLines=sqliteTable('stock_job_lines',{
 jobId:text('job_id').notNull().references(()=>stockJobs.id),productId:text('product_id').notNull().references(()=>masterProducts.id),quantity:integer('quantity').notNull(),used:integer('used'),
},t=>[uniqueIndex('stock_job_product').on(t.jobId,t.productId)]);
export const masterAudit=sqliteTable('master_audit',{
 id:text('id').primaryKey(),subjectId:text('subject_id').notNull(),action:text('action').notNull(),actor:text('actor').notNull(),payload:text('payload').notNull(),createdAt:text('created_at').notNull(),
});
export const buildVersions=sqliteTable('build_versions',{
 id:text('id').primaryKey(),buildId:text('build_id').notNull(),version:integer('version').notNull(),parentId:text('parent_id'),keyHash:text('key_hash').notNull().unique(),accessHash:text('access_hash').notNull(),fingerprint:text('fingerprint').notNull(),config:text('config_json').notNull(),estimate:text('estimate_json').notNull(),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('build_version_number').on(t.buildId,t.version)]);
export const curatedPackages=sqliteTable('curated_packages',{
 id:text('id').primaryKey(),sourceKey:text('source_key').notNull().unique(),title:text('title').notNull(),category:text('category').notNull(),state:text('state').notNull(),revision:integer('revision').notNull(),data:text('data_json').notNull(),updatedAt:text('updated_at').notNull(),
});
export const buildStandards=sqliteTable('build_standards',{
 id:text('id').primaryKey(),sourceKey:text('source_key').notNull().unique(),title:text('title').notNull(),category:text('category').notNull(),state:text('state').notNull(),revision:integer('revision').notNull(),data:text('data_json').notNull(),updatedAt:text('updated_at').notNull(),
});
export const productSupply=sqliteTable('product_supply',{
 productId:text('product_id').primaryKey().references(()=>masterProducts.id),revision:integer('revision').notNull(),data:text('data_json').notNull(),updatedAt:text('updated_at').notNull(),
});
export const packageQuotes=sqliteTable('package_quotes',{
 id:text('id').primaryKey(),number:text('number').notNull().unique(),packageId:text('package_id').notNull().references(()=>curatedPackages.id),packageRevision:integer('package_revision').notNull(),keyHash:text('key_hash').notNull().unique(),accessHash:text('access_hash').notNull(),fingerprint:text('fingerprint').notNull(),snapshot:text('snapshot_json').notNull(),createdAt:text('created_at').notNull(),
});
export const catalogSourceRows=sqliteTable('catalog_source_rows',{
 id:text('id').primaryKey(),sourceKey:text('source_key').notNull().unique(),sourceId:text('source_id').notNull(),kind:text('kind').notNull(),title:text('title').notNull(),group:text('group_name').notNull(),file:text('file').notNull(),sheet:text('sheet').notNull(),row:integer('row_number').notNull(),data:text('data_json').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('source_rows_kind_group').on(t.kind,t.group)]);
export const quoteJobHandoffs=sqliteTable('quote_job_handoffs',{
 quoteId:text('quote_id').primaryKey().references(()=>packageQuotes.id),jobId:text('job_id').notNull().unique().references(()=>stockJobs.id),createdBy:text('created_by').notNull(),createdAt:text('created_at').notNull(),
});
export const jobRequirements=sqliteTable('job_requirements',{
 jobId:text('job_id').notNull().references(()=>stockJobs.id),productId:text('product_id').notNull().references(()=>masterProducts.id),quantity:integer('quantity').notNull(),
},t=>[uniqueIndex('job_requirement_product').on(t.jobId,t.productId)]);
export const jobPurchaseOrders=sqliteTable('job_purchase_orders',{
 orderId:text('order_id').primaryKey().references(()=>purchaseOrders.id),jobId:text('job_id').notNull().references(()=>stockJobs.id),
});
export const packageReleases=sqliteTable('package_releases',{
 id:text('id').primaryKey(),packageId:text('package_id').notNull().references(()=>curatedPackages.id),revision:integer('revision').notNull(),title:text('title').notNull(),category:text('category').notNull(),data:text('data_json').notNull(),active:integer('active').notNull(),publishedBy:text('published_by').notNull(),publishedAt:text('published_at').notNull(),
},t=>[uniqueIndex('package_release_revision').on(t.packageId,t.revision),index('package_release_active').on(t.packageId,t.active)]);
export const packageVersions=sqliteTable('package_versions',{
 id:text('id').primaryKey(),packageId:text('package_id').notNull().references(()=>curatedPackages.id),revision:integer('revision').notNull(),title:text('title').notNull(),category:text('category').notNull(),state:text('state').notNull(),data:text('data_json').notNull(),action:text('action').notNull(),actor:text('actor'),createdAt:text('created_at').notNull(),
},t=>[uniqueIndex('package_version_revision').on(t.packageId,t.revision)]);
