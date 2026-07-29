import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["owner", "accountant", "viewer"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull().default(310000),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(true),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  scopes: text("scopes").notNull().default('["loan:read","loan:export"]'),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  lastLoginAt: integer("last_login_at"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
  lastSeenAt: integer("last_seen_at").notNull(),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  revokedAt: integer("revoked_at"),
}, (table) => [
  index("sessions_user_idx").on(table.userId),
  index("sessions_expiry_idx").on(table.expiresAt),
]);

export const loginAttempts = sqliteTable("login_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull(),
  ipHash: text("ip_hash").notNull(),
  attemptedAt: integer("attempted_at").notNull(),
  succeeded: integer("succeeded", { mode: "boolean" }).notNull().default(false),
}, (table) => [index("login_attempt_lookup_idx").on(table.username, table.ipHash, table.attemptedAt)]);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id"),
  eventType: text("event_type").notNull(),
  targetUserId: text("target_user_id"),
  metadata: text("metadata").notNull().default("{}"),
  ipHash: text("ip_hash"),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("audit_created_idx").on(table.createdAt),
  index("audit_actor_idx").on(table.actorUserId),
]);
