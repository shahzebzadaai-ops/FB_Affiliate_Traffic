import { connection } from "next/server";
import { assignmentView, setPageAssignment } from "@/server/access";
import { getCurrentUser } from "@/server/current-user";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  return Response.json(await assignmentView(user));
}

export async function POST(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { userId?: string; pageCode?: string; assigned?: boolean } | null;
  const result = await setPageAssignment(user, body?.userId ?? "", body?.pageCode ?? "", Boolean(body?.assigned));
  if (!result.ok) return Response.json({ error: result.error }, { status: 403 });
  return Response.json(await assignmentView(user));
}
