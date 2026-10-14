import { connection } from "next/server";
import { getCurrentUser } from "@/server/current-user";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user });
}
