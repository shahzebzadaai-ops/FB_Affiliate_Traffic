import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { BUILD_CAMPAIGN, confirmLaunch, type CampaignRecord } from "@/domain/campaign";

const campaignSchema = z
  .object({
    status: z.enum(["BUILD", "ACTIVE"]),
    startedAt: z.string().datetime().nullable(),
  })
  .refine((record) => (record.status === "BUILD" ? record.startedAt === null : Boolean(record.startedAt)), {
    message: "An active campaign needs a UTC start timestamp, and build mode must not have one.",
  });

export function campaignFilePath(): string {
  return process.env.CAMPAIGN_STATE_PATH ?? path.join(process.cwd(), "data", "local", "campaign-launch.json");
}

export function readCampaign(file = campaignFilePath()): CampaignRecord {
  try {
    const parsed = campaignSchema.parse(JSON.parse(readFileSync(file, "utf8")));
    return parsed;
  } catch (error) {
    if (isMissingFile(error)) return BUILD_CAMPAIGN;
    throw error;
  }
}

export function writeCampaign(record: CampaignRecord, file = campaignFilePath()): CampaignRecord {
  const checked = campaignSchema.parse(record);
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(checked, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, file);
  return checked;
}

export function confirmLaunchFile(now: Date, confirm: boolean, file = campaignFilePath()): {
  ok: boolean;
  record: CampaignRecord;
  reason?: string;
} {
  const current = readCampaign(file);
  const result = confirmLaunch(current, now, confirm);
  if (!result.ok) return result;
  if (result.record === current) return result;
  return { ok: true, record: writeCampaign(result.record, file) };
}

function isMissingFile(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}
