import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const projectStatusEnum = pgEnum("project_status", ["open", "closed"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: roleEnum("role").default("user").notNull(),
  university: varchar("university", { length: 255 }),
  skills: text("skills"),
  portfolioLink: varchar("portfolio_link", { length: 512 }),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  neededRoles: text("needed_roles").notNull(),
  maxTeamSize: integer("max_team_size").notNull().default(5),
  status: projectStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;

export const joinRequests = pgTable("join_requests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  requesterId: integer("requester_id").notNull(),
  message: text("message"),
  status: requestStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type JoinRequest = typeof joinRequests.$inferSelect;
export type InsertJoinRequest = typeof joinRequests.$inferInsert;

export const workspaceLinks = pgTable("workspace_links", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  addedByUserId: integer("added_by_user_id").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WorkspaceLink = typeof workspaceLinks.$inferSelect;
export type InsertWorkspaceLink = typeof workspaceLinks.$inferInsert;

// Manual-outreach tracker: each person we contact gets a row with a unique
// refCode. When someone signs up via /?ref=<code>, we link their user id here,
// which lets the dashboard show contacted → signed up → posted conversion.
export const outreachContacts = pgTable("outreach_contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 50 }),
  note: text("note"),
  hasIdea: boolean("has_idea").default(false).notNull(),
  refCode: varchar("ref_code", { length: 16 }).notNull().unique(),
  signedUpUserId: integer("signed_up_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OutreachContact = typeof outreachContacts.$inferSelect;
export type InsertOutreachContact = typeof outreachContacts.$inferInsert;
