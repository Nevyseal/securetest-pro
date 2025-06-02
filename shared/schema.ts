import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scanTargets = pgTable("scan_targets", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  authToken: text("auth_token"),
  testParameters: text("test_parameters"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scanConfigurations = pgTable("scan_configurations", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").references(() => scanTargets.id).notNull(),
  injectionTypes: jsonb("injection_types").notNull(), // Array of strings
  intensityLevel: text("intensity_level").notNull(),
  requestDelay: integer("request_delay").notNull(),
  followRedirects: boolean("follow_redirects").default(true),
  testCookies: boolean("test_cookies").default(false),
  logRequests: boolean("log_requests").default(true),
});

export const scanResults = pgTable("scan_results", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").references(() => scanTargets.id).notNull(),
  status: text("status").notNull(), // 'running', 'completed', 'failed', 'stopped'
  progress: integer("progress").default(0),
  vulnerabilities: jsonb("vulnerabilities").notNull(), // Array of vulnerability objects
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const vulnerabilities = pgTable("vulnerabilities", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").references(() => scanResults.id).notNull(),
  severity: text("severity").notNull(), // 'critical', 'high', 'medium', 'low', 'info'
  type: text("type").notNull(), // 'union-based', 'boolean-based', 'time-based', 'error-based'
  parameter: text("parameter").notNull(),
  payload: text("payload").notNull(),
  description: text("description").notNull(),
  cvssScore: text("cvss_score"),
  endpoint: text("endpoint").notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
});

// Insert schemas
export const insertScanTargetSchema = createInsertSchema(scanTargets).pick({
  url: true,
  authToken: true,
  testParameters: true,
});

export const insertScanConfigSchema = createInsertSchema(scanConfigurations).pick({
  targetId: true,
  injectionTypes: true,
  intensityLevel: true,
  requestDelay: true,
  followRedirects: true,
  testCookies: true,
  logRequests: true,
});

export const insertScanResultSchema = createInsertSchema(scanResults).pick({
  targetId: true,
  status: true,
  progress: true,
  vulnerabilities: true,
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities).pick({
  scanId: true,
  severity: true,
  type: true,
  parameter: true,
  payload: true,
  description: true,
  cvssScore: true,
  endpoint: true,
});

// Types
export type ScanTarget = typeof scanTargets.$inferSelect;
export type InsertScanTarget = z.infer<typeof insertScanTargetSchema>;

export type ScanConfiguration = typeof scanConfigurations.$inferSelect;
export type InsertScanConfiguration = z.infer<typeof insertScanConfigSchema>;

export type ScanResult = typeof scanResults.$inferSelect;
export type InsertScanResult = z.infer<typeof insertScanResultSchema>;

export type Vulnerability = typeof vulnerabilities.$inferSelect;
export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;
