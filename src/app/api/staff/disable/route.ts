import { connection } from "next/server";
import { can } from "@/domain/permissions";
import { disableAccount } from "@/server/accounts";
import { getCurrentUser } from "@/server/current-user";

export async function POST(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!can(user.role, "manage_users")) return Response.json({ error: "Staff administration is owner-only." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  const result = await disableAccount(body?.userId ?? "", user.id);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true });
}
