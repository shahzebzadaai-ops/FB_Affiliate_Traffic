import { connection } from "next/server";
import { z } from "zod";
import { httpsWebsite } from "@/domain/muse";
import { museOverview, recordBalance, recordUsage, requirePlanner, setWebsite } from "@/server/muse";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

const commandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("website"),
    websiteUrl: z.string().max(300).nullable(),
  }),
  z.object({
    action: z.literal("balance"),
    balance: z.number().int().min(0).max(10_000_000_000_000),
    spent: z.number().int().min(0).max(10_000_000_000_000).nullable(),
    note: z.string().max(500),
  }),
  z.object({
    action: z.literal("usage"),
    kind: z.enum(["FINISHED_VIDEO", "FINISHED_IMAGE", "REJECTED"]),
    spent: z.number().int().min(0).max(10_000_000_000_000).nullable(),
    note: z.string().max(500),
  }),
]);

export async function GET() {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const overview = await museOverview();
  return json({
    ...overview,
    assets: overview.assets.map((asset) => ({
      ...asset,
      generated_on: asset.generated_on instanceof Date ? asset.generated_on.toISOString().slice(0, 10) : String(asset.generated_on).slice(0, 10),
      created_at: asset.created_at instanceof Date ? asset.created_at.toISOString() : new Date(asset.created_at).toISOString(),
    })),
    balances: overview.balances.map((row) => ({
      ...row,
      recorded_at: row.recorded_at instanceof Date ? row.recorded_at.toISOString() : new Date(row.recorded_at).toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requirePlanner();
  if (!gate.ok) return json({ error: gate.error }, gate.status);
  const parsed = commandSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "That Muse entry could not be read." }, 400);
  const command = parsed.data;
  if (command.action === "website") {
    const website = command.websiteUrl && command.websiteUrl.trim() ? httpsWebsite(command.websiteUrl) : null;
    if (command.websiteUrl && command.websiteUrl.trim() && !website) {
      return json({ error: "The website must be an https address without a username or password." }, 400);
    }
    await setWebsite(website);
    return json({ website });
  }
  if (command.action === "balance") {
    await recordBalance(gate.user.id, command.balance, command.spent, command.note.trim());
    return json({ ok: true });
  }
  await recordUsage(gate.user.id, command.kind, command.spent, command.note.trim());
  return json({ ok: true });
}
