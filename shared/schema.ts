import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Project Tags
export const projectTags = pgTable("project_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertProjectTagSchema = createInsertSchema(projectTags).pick({
  name: true,
});

export type InsertProjectTag = z.infer<typeof insertProjectTagSchema>;
export type ProjectTag = typeof projectTags.$inferSelect;

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  date: text("date").notNull(), // Store as YYYY-MM-DD for easier querying
  startTime: text("start_time").notNull(), // Store as HH:MM in 24-hour format
  endTime: text("end_time"), // Optional if using duration-based input
  durationMinutes: integer("duration_minutes").notNull(), // Calculated or directly provided
  projectTags: text("project_tags").array().notNull(), // Store as array of tag names
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Activity input form schemas for different time entry methods
export const activityTimeInputSchema = z.object({
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  projectTags: z.array(z.string()).min(1, "At least one project tag is required"),
});

export const startStopTimeSchema = activityTimeInputSchema.extend({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  inputMethod: z.literal("startStop"),
});

export const durationTimeSchema = activityTimeInputSchema.extend({
  startTime: z.string().min(1, "Start time is required"),
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  inputMethod: z.literal("duration"),
});

export const activityInputSchema = z.discriminatedUnion("inputMethod", [
  startStopTimeSchema,
  durationTimeSchema,
]);

export type ActivityTimeInput = z.infer<typeof activityTimeInputSchema>;
export type StartStopTimeInput = z.infer<typeof startStopTimeSchema>;
export type DurationTimeInput = z.infer<typeof durationTimeSchema>;
export type ActivityInput = z.infer<typeof activityInputSchema>;

// User schema (basic, as not explicitly required)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
