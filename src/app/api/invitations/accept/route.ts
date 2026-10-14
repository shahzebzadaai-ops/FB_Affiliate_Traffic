import { connection } from "next/server";
import { cookies } from "next/headers";
import { acceptInvitation } from "@/server/access";
import { openSession } from "@/server/accounts";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/current-user";

export async function POST(request: Request) {
  await connection();
  const body = (await request.json().catch(() => null)) as { token?: string; password?: string } | null;
  const accepted = await acceptInvitation(body?.token ?? "", body?.password ?? "");
  if (!accepted.ok) return Response.json({ error: accepted.error }, { status: 400 });
  const token = await openSession(accepted.user);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
  return Response.json({ user: accepted.user });
}
