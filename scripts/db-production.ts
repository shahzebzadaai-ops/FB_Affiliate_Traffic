import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";
import { migrateDatabase, seedDatabase } from "../src/db/setup.ts";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const index = line.indexOf("=");
    if (index > 0 && !process.env[line.slice(0, index)]) process.env[line.slice(0, index)] = line.slice(index + 1);
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");
if (process.env.AFFIGROVE_DB_RESET === "1") {
  throw new Error("Refusing to reset the database. AFFIGROVE_DB_RESET is not a supported production action.");
}

const sql = postgres(databaseUrl, { max: 1 });
const [identity] = await sql<{ db: string; addr: string | null }[]>`
  select current_database() as db, inet_server_addr()::text as addr
`;
if (identity?.addr && identity.addr !== "127.0.0.1/32" && identity.addr !== "127.0.0.1") {
  throw new Error(`Refusing a database that is not on localhost (${identity.addr}).`);
}

await migrateDatabase(databaseUrl);
const [content] = await sql<{ n: number }[]>`select count(*)::int as n from content_items`;
if ((content?.n ?? 0) === 0) {
  await seedDatabase(databaseUrl);
  console.log("Seeded an empty database.");
} else {
  console.log(`Left ${content?.n} existing content rows unchanged.`);
}

const [campaign] = await sql<{ status: string; not_started: boolean }[]>`
  select status, started_at is null as not_started from campaigns where id = 'uk-month-one'
`;
console.log(`campaign uk-month-one status=${campaign?.status ?? "missing"} not_started=${campaign?.not_started ?? "missing"}`);
await sql.end();
