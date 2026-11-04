// Shared test setup: a fresh in-memory Postgres (PGlite, Postgres compiled to
// WASM) per test file, migrated with the same SQL files production uses.
// No Supabase, Clerk or Resend needed.
import { join } from "path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import { setDb } from "../src/db";
import { appRouter } from "../src/routers";
import { users, type User } from "../src/schema";

export async function freshDb() {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: join(__dirname, "../drizzle/migrations") });
  setDb(db);
  return db;
}

export async function resetDb(db: Awaited<ReturnType<typeof freshDb>>) {
  await db.execute(sql`
    truncate users, projects, project_members, join_requests, workspace_links,
      outreach_contacts restart identity`);
}

let seq = 0;
export async function makeUser(
  db: Awaited<ReturnType<typeof freshDb>>,
  fields: Partial<typeof users.$inferInsert> = {}
): Promise<User> {
  seq++;
  const [user] = await db
    .insert(users)
    .values({
      clerkId: `user_test_${seq}`,
      name: `Test User ${seq}`,
      email: `user${seq}@example.test`,
      ...fields,
    })
    .returning();
  return user;
}

// A tRPC caller that behaves like a request from `user` (or a logged-out visitor).
export function callerFor(user: User | null) {
  return appRouter.createCaller({ user });
}
