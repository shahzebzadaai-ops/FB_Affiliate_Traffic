import { readFileSync } from "node:fs";

const text = readFileSync(".env.local", "utf8");
for (const line of text.split("\n")) {
  const index = line.indexOf("=");
  if (index > 0) process.env[line.slice(0, index)] = line.slice(index + 1);
}
if (process.env.DATABASE_URL_TEST) process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
