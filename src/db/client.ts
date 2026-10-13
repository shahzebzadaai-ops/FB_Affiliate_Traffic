import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { atosSql?: ReturnType<typeof postgres> };

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. This development database is local PostgreSQL, not production hosting.");
  return url;
}

export function getSql() {
  globalForDb.atosSql ??= postgres(databaseUrl(), { max: 10 });
  return globalForDb.atosSql;
}

export function getDb() {
  return drizzle(getSql(), { schema });
}
