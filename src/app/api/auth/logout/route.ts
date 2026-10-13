import { connection } from "next/server";
import { cookies } from "next/headers";
import { revokeToken } from "@/server/accounts";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/current-user";

export async function POST() {
  await connection();
  const jar = await cookies();
  await revokeToken(jar.get(SESSION_COOKIE)?.value);
  jar.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return Response.json({ ok: true });
}
