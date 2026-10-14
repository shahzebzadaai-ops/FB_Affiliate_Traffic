import { connection } from "next/server";
import { cookies } from "next/headers";
import { authenticate } from "@/server/accounts";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/current-user";

export async function POST(request: Request) {
  await connection();
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const session = await authenticate(body?.email ?? "", body?.password ?? "", ip);
  if (!session.ok) return Response.json({ error: session.error }, { status: 401 });
  (await cookies()).set(SESSION_COOKIE, session.token, sessionCookieOptions());
  return Response.json({ user: session.user });
}
