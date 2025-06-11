import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  avatarUrl: text('avatar_url'),
  displayName: text('display_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  templates: many(templates),
  generatedPdfs: many(generatedPdfs),
  activityLogs: many(activityLogs),
}));

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  placeholders: jsonb('placeholders'),
  useCount: integer('use_count').default(0),
  uploadDate: timestamp('upload_date', { withTimezone: true }).defaultNow(),
});

export const templatesRelations = relations(templates, ({ one, many }) => ({
  user: one(profiles, {
    fields: [templates.userId],
    references: [profiles.id],
  }),
  generatedPdfs: many(generatedPdfs),
}));

export const generatedPdfs = pgTable('generated_pdfs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  placeholderData: jsonb('placeholder_data'),
  generatedDate: timestamp('generated_date', { withTimezone: true }).defaultNow(),
});

export const generatedPdfsRelations = relations(generatedPdfs, ({ one }) => ({
  user: one(profiles, {
    fields: [generatedPdfs.userId],
    references: [profiles.id],
  }),
  template: one(templates, {
    fields: [generatedPdfs.templateId],
    references: [templates.id],
  }),
}));

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(profiles, {
    fields: [activityLogs.userId],
    references: [profiles.id],
  }),
})); 