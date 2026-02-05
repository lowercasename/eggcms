import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Tracks schema state for migrations
export const schemasTable = sqliteTable('_schemas', {
  name: text('name').primaryKey(),
  type: text('type').notNull(), // 'singleton' | 'collection'
  hash: text('hash').notNull(),
  fieldsJson: text('fields_json').notNull(),
})

// Media registry - uses UUID for id
export const mediaTable = sqliteTable('_media', {
  id: text('id').primaryKey(), // UUID
  filename: text('filename').notNull(),
  path: text('path').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt'),
  createdAt: text('created_at').notNull(),
})
