import { connection } from "next/server";
import { createInvitation } from "@/server/access";
import { getCurrentUser } from "@/server/current-user";

export async function POST(request: Request) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { name?: string; email?: string; pageCodes?: string[] } | null;
  const result = await createInvitation(user, {
    name: body?.name ?? "",
    email: body?.email ?? "",
    pageCodes: Array.isArray(body?.pageCodes) ? body.pageCodes : [],
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: 403 });
  return Response.json({ acceptPath: result.acceptPath });
}
