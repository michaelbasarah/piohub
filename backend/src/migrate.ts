import "./env";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { join } from "path";
import { ENV } from "./env";

const MIGRATIONS = join(__dirname, "../drizzle/migrations");
const TABLES = ["users", "projects", "project_members", "join_requests", "workspace_links"];
const TYPES = ["role", "project_status", "request_status"];

async function main() {
  const sql = postgres(ENV.databaseUrl, { ssl: "require", max: 1 });

  const tableRows = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name = any(${TABLES})`;
  const typeRows = await sql`
    select t.typname from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = any(${TYPES})`;

  const existingTables = tableRows.map((r) => r.table_name as string);
  const existingTypes = typeRows.map((r) => r.typname as string);
  const allExist =
    TABLES.every((t) => existingTables.includes(t)) &&
    TYPES.every((t) => existingTypes.includes(t));
  const noneExist = existingTables.length === 0 && existingTypes.length === 0;

  if (allExist) {
    // Schema pre-dates the migrator (created via Supabase dashboard) — record
    // the init migration as applied so migrate() skips it.
    const journal = JSON.parse(
      readFileSync(join(MIGRATIONS, "meta/_journal.json"), "utf8")
    );
    const entry = journal.entries[0];
    const file = readFileSync(join(MIGRATIONS, `${entry.tag}.sql`), "utf8");
    const hash = createHash("sha256").update(file).digest("hex");

    await sql`create schema if not exists drizzle`;
    await sql`create table if not exists drizzle.__drizzle_migrations (
      id serial primary key, hash text not null, created_at bigint)`;
    const applied = await sql`
      select 1 from drizzle.__drizzle_migrations
      where created_at >= ${entry.when} limit 1`;
    if (applied.length === 0) {
      await sql`insert into drizzle.__drizzle_migrations (hash, created_at)
        values (${hash}, ${entry.when})`;
      console.log(`Baselined existing schema as ${entry.tag}`);
    }
  } else if (!noneExist) {
    const missingTables = TABLES.filter((t) => !existingTables.includes(t));
    const missingTypes = TYPES.filter((t) => !existingTypes.includes(t));
    throw new Error(
      `Partial schema detected — missing tables: [${missingTables.join(", ")}], ` +
        `missing types: [${missingTypes.join(", ")}]. Fix manually in Supabase SQL editor.`
    );
  }

  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: MIGRATIONS });
  console.log("Migrations up to date");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
