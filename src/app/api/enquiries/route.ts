import { connection } from "next/server";
import { getCurrentUser } from "@/server/current-user";
import { listPublicEnquiries } from "@/server/enquiries";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401, headers: { "cache-control": "no-store" } });
  const result = await listPublicEnquiries(user.role);
  if (!result.ok) return Response.json({ error: result.error }, { status: 403, headers: { "cache-control": "no-store" } });
  return Response.json(
    {
      enquiries: result.rows.map((row) => ({
        ...row,
        created_at: row.created_at.toISOString(),
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
