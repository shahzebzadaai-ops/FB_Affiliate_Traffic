import { connection } from "next/server";
import { getCurrentUser } from "@/server/current-user";
import { financeResponse } from "@/server/finance";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  const result = financeResponse(user);
  return Response.json(result.body, { status: result.status });
}
