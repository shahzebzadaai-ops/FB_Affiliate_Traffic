import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { mandalaActions, mandalaGoals, mandalaPillars } from "@/db/schema";
import { getCurrentUser } from "@/server/current-user";
import { canEnterOwner } from "@/server/task-commands";

export async function GET() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!canEnterOwner(user.role)) return Response.json({ error: "The Mandala is owner-only." }, { status: 403 });
  const db = getDb();
  const [goal] = await db.select().from(mandalaGoals);
  const pillars = await db.select().from(mandalaPillars).orderBy(asc(mandalaPillars.position));
  const actions = await db.select().from(mandalaActions).orderBy(asc(mandalaActions.position));
  return Response.json({
    goal: goal
      ? {
          id: goal.id,
          title: goal.title,
          targetAmountCents: goal.targetAmountCents,
          currency: goal.currency,
          notes: goal.notes,
          measuredApprovedRevenue: null,
        }
      : null,
    pillars: pillars.map((pillar) => ({
      ...pillar,
      actions: actions.filter((action) => action.pillarId === pillar.id),
    })),
  });
}
