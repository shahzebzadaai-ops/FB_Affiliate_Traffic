import { readFileSync } from "node:fs";
import { migrateDatabase, seedDatabase } from "../src/db/setup.ts";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const index = line.indexOf("=");
  if (index > 0 && !process.env[line.slice(0, index)]) process.env[line.slice(0, index)] = line.slice(index + 1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing");
await migrateDatabase(databaseUrl);
await seedDatabase(databaseUrl);
console.log("Development database migrated and seeded.");
