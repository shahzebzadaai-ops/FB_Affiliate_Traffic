import { connection } from "next/server";
import { cookies } from "next/headers";
import { authenticate, countUsers, createAccount } from "@/server/accounts";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/current-user";

export async function POST(request: Request) {
  await connection();
  if ((await countUsers()) > 0) {
    return Response.json({ error: "Owner setup has already been completed." }, { status: 409 });
  }
  const body = (await request.json().catch(() => null)) as { name?: string; email?: string; password?: string } | null;
  const created = await createAccount({
    personKey: "shahzeb",
    email: body?.email ?? "",
    name: body?.name ?? "",
    role: "SUPER_ADMIN",
    password: body?.password ?? "",
  });
  if (!created.ok) return Response.json({ error: created.error }, { status: 400 });
  const session = await authenticate(created.user.email, body?.password ?? "", "setup");
  if (!session.ok) return Response.json({ error: "The owner account was created, but the session was not." }, { status: 500 });
  (await cookies()).set(SESSION_COOKIE, session.token, sessionCookieOptions());
  return Response.json({ user: session.user });
}
