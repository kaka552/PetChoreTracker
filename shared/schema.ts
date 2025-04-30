import { pgTable, text, serial, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - stores user authentication and role information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('user'), // 'user' or 'dev'
});

// Models table - stores 3D models and their associated target images
export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  model_name: text("model_name").notNull(),
  image_target: text("image_target").notNull(), // URL to target image
  model_file_url: text("model_file_url").notNull(), // URL to 3D model file
  description: text("description").notNull(),
  uploaded_by: serial("uploaded_by").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
});

export const insertModelSchema = createInsertSchema(models).pick({
  model_name: true,
  image_target: true,
  model_file_url: true,
  description: true,
  uploaded_by: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof models.$inferSelect;
