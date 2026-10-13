import { connection } from "next/server";
import { can } from "@/domain/permissions";
import { createAccount, listAccounts } from "@/server/accounts";
import { getCurrentUser } from "@/server/current-user";
import type { Role } from "@/domain/types";

const INVITE_ROLES: Role[] = ["CONTENT_OPERATOR", "DESIGNER", "VIDEO_EDITOR"];

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!can(user.role, "manage_users")) return Response.json({ error: "Staff administration is owner-only." }, { status: 403 });
  return Response.json({ users: await listAccounts() });
}

export async function POST(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!can(user.role, "manage_users")) return Response.json({ error: "Staff administration is owner-only." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    password?: string;
    personKey?: string;
    role?: Role;
  } | null;
  const role = body?.role ?? "CONTENT_OPERATOR";
  if (!INVITE_ROLES.includes(role)) return Response.json({ error: "That role cannot be invited from this screen." }, { status: 400 });
  const created = await createAccount({
    personKey: body?.personKey ?? "",
    email: body?.email ?? "",
    name: body?.name ?? "",
    role,
    password: body?.password ?? "",
  });
  if (!created.ok) return Response.json({ error: created.error }, { status: 400 });
  return Response.json({ user: created.user });
}
