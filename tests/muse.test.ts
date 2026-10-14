import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { contentRecords } from "@/content/catalog";
import { migrateDatabase, resetDatabase, seedDatabase } from "@/db/setup";
import { getSql } from "@/db/client";
import {
  httpsWebsite,
  musePackageSchema,
  packageMarkdown,
  prepareMusePackage,
  tokenSummary,
} from "@/domain/muse";
import { pageByCode } from "@/domain/pages";
import { can } from "@/domain/permissions";
import { createAccount } from "@/server/accounts";
import {
  createPackages,
  markSceneGenerated,
  readAssetFile,
  recordBalance,
  recordUsage,
  regeneratePackage,
  reviewAsset,
  saveAsset,
  setWebsite,
  updatePackage,
} from "@/server/muse";

const databaseUrl = process.env.DATABASE_URL ?? "";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

beforeAll(async () => {
  process.env.AFFIGROVE_MEDIA_DIR = mkdtempSync(path.join(tmpdir(), "affigrove-muse-"));
  await migrateDatabase(databaseUrl);
  await resetDatabase(databaseUrl);
  await seedDatabase(databaseUrl);
}, 120_000);

describe("Muse package compiler", () => {
  const reel = contentRecords.find((record) => record.contentId === "UK-BGUK-001");

  it("prepares three reel concepts and six image prompts from the plan, without a model", () => {
    expect(reel?.format).toBe("REEL");
    expect(reel?.monetisation).toBe("none");
    if (!reel) return;
    const page = pageByCode(reel.pageCode);
    const packages = (["ugc", "problem", "educational"] as const).map((preset) => prepareMusePackage(reel, page, preset));
    expect(packages.map((item) => item.preset)).toEqual(["ugc", "problem", "educational"]);
    for (const body of packages) {
      expect(musePackageSchema.safeParse(body).success).toBe(true);
      expect(body.source).toBe("plan-brief");
      expect(body.model).toBeNull();
      expect(body.publishing).toBe("disabled");
      expect(body.offerId).toBeNull();
      expect(body.campaignId).toBe("uk-month-one");
      expect(body.images).toHaveLength(6);
      expect(body.images.map((image) => image.aspectRatio)).toEqual(["9:16", "4:5", "1:1", "9:16", "9:16", "1:1"]);
      expect(body.strategy.angles).toHaveLength(3);
      expect(body.strategy.hooks).toHaveLength(3);
      expect(body.strategy.audience).toContain("United Kingdom");
      expect(body.strategy.benefits).toContain("No product benefits");
      expect(body.social.affiliatePlacement).toContain("Do not place an affiliate link");
      expect(body.reel?.scenes[0]?.durationSeconds).toBe(3);
      expect(body.reel?.negativePrompt).toContain("American accent");
      expect(packageMarkdown(body)).toContain("Scene 1");
      expect(JSON.stringify(body)).not.toMatch(/password|apiKey|credential/i);
    }
  });

  it("does not treat the advertised billion tokens as a measured balance", () => {
    expect(tokenSummary([], []).lastBalance).toBeNull();
    expect(tokenSummary([], []).averageTokensPerSuccessfulAsset).toBeNull();
    expect(tokenSummary([], []).advertisedOpeningBalance).toBe(1_000_000_000);
    const partial = tokenSummary(
      [{ recordedBalance: 900_000_000, tokensSpent: null, recordedAt: "2026-10-14T12:00:00.000Z" }],
      [
        { kind: "FINISHED_VIDEO", tokensSpent: 100 },
        { kind: "FINISHED_IMAGE", tokensSpent: null },
      ],
    );
    expect(partial.lastBalance).toBe(900_000_000);
    expect(partial.tokensSpent).toBeNull();
    expect(partial.averageTokensPerSuccessfulAsset).toBeNull();
    const complete = tokenSummary([], [
      { kind: "FINISHED_VIDEO", tokensSpent: 100 },
      { kind: "FINISHED_IMAGE", tokensSpent: 50 },
      { kind: "REJECTED", tokensSpent: 80 },
    ]);
    expect(complete.finishedVideos).toBe(1);
    expect(complete.finishedImages).toBe(1);
    expect(complete.rejected).toBe(1);
    expect(complete.averageTokensPerSuccessfulAsset).toBe(75);
    expect(complete.lastBalance).toBeNull();
  });

  it("accepts only an https website without credentials", () => {
    expect(httpsWebsite("https://example.com/studio")).toBe("https://example.com/studio");
    expect(httpsWebsite("http://example.com")).toBeNull();
    expect(httpsWebsite("https://user:secret@example.com")).toBeNull();
  });

  it("keeps Muse preparation away from publishing operators", () => {
    expect(can("PUBLISHING_OPERATOR", "manage_plan")).toBe(false);
    expect(can("SUPER_ADMIN", "manage_plan")).toBe(true);
    expect(can("CONTENT_MANAGER", "manage_plan")).toBe(true);
  });
});

describe("Muse campaign library", () => {
  it("stores three concepts, an uploaded file, a review, and a typed balance without publishing", async () => {
    const created = await createPackages("UK-BGUK-001", ["ugc", "problem", "educational"]);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.ids).toHaveLength(3);
    const sql = getSql();
    const rows = await sql<{ preset: string; stage: string; package: { images: unknown[]; publishing: string } }[]>`
      select preset, stage, package from creative_packages where content_id = 'UK-BGUK-001' order by preset
    `;
    expect(rows.map((row) => row.preset).sort()).toEqual(["educational", "problem", "ugc"]);
    expect(rows.every((row) => row.stage === "PROMPTS_READY" && row.package.images.length === 6 && row.package.publishing === "disabled")).toBe(true);

    const [full] = await sql<{ id: string; package: { reel: { scenes: { prompt: string }[] } } }[]>`
      select id, package from creative_packages where content_id = 'UK-BGUK-001' and preset = 'ugc'
    `;
    full.package.reel.scenes[0].prompt = `${full.package.reel.scenes[0].prompt} Extra continuity note for the cafe.`;
    const saved = await updatePackage(full.id, { package: full.package as never, bump: true });
    expect(saved.ok).toBe(true);
    const marked = await markSceneGenerated(full.id, 1);
    expect(marked.ok && marked.stage).toBe("EXTERNAL_GENERATION");
    const regenerated = await regeneratePackage(full.id);
    expect(regenerated.ok).toBe(true);
    if (!regenerated.ok) return;
    expect(regenerated.promptVersion).toBe(3);
    expect(regenerated.package.model).toBeNull();

    const asset = await saveAsset({
      packageId: full.id,
      sceneNumber: 1,
      imageId: null,
      bytes: png,
      filename: "../../outside.png",
      aspectRatio: "9:16",
      durationSeconds: 28,
      width: 1080,
      height: 1920,
      reviewNotes: "Pilot still from the manual studio.",
    });
    expect(asset.ok).toBe(true);
    if (!asset.ok) return;
    expect(asset.storagePath.includes("..")).toBe(false);
    const file = await readAssetFile(asset.id);
    expect(file?.bytes.equals(png)).toBe(true);
    expect(file?.type).toBe("image/png");

    const review = await reviewAsset(asset.id, "APPROVED", "Usable still. Do not publish.");
    expect(review.ok).toBe(true);
    if (!review.ok) return;
    expect(review.campaign).toMatchObject({ status: "BUILD", not_started: true });

    const [content] = await sql<{ publication_status: string }[]>`
      select publication_status from content_items where content_id = 'UK-BGUK-001'
    `;
    const [campaign] = await sql<{ status: string; started_at: Date | null }[]>`
      select status, started_at from campaigns where id = 'uk-month-one'
    `;
    expect(content.publication_status).toBe("UNPUBLISHED");
    expect(campaign).toMatchObject({ status: "BUILD", started_at: null });

    const owner = await createAccount({
      personKey: "muse-owner",
      email: "muse-owner@example.com",
      name: "Muse Owner",
      role: "SUPER_ADMIN",
      password: "owner-test-password",
    });
    expect(owner.ok).toBe(true);
    if (!owner.ok) return;
    await setWebsite("https://example.com/muse");
    await recordBalance(owner.user.id, 900_000_000, 1_000, "Typed after the pilot. Not an API reading.");
    await recordUsage(owner.user.id, "FINISHED_IMAGE", null, "Token figure unknown.");
    const [provider] = await sql<{ website_url: string | null; notes: string }[]>`
      select website_url, notes from creative_providers where id = 'muse-web-studio'
    `;
    expect(provider.website_url).toBe("https://example.com/muse");
    expect(provider.notes.toLowerCase()).not.toContain("password");
    const [balance] = await sql<{ recorded_balance: string; tokens_spent: string }[]>`
      select recorded_balance::text, tokens_spent::text from provider_balances order by recorded_at desc limit 1
    `;
    expect(balance.recorded_balance).toBe("900000000");
    expect(balance.tokens_spent).toBe("1000");
    const [stored] = await sql<{ approval_status: string; offer_id: string | null; provider_id: string }[]>`
      select approval_status, offer_id, provider_id from creative_assets where id = ${asset.id}
    `;
    expect(stored).toMatchObject({ approval_status: "APPROVED", offer_id: null, provider_id: "muse-web-studio" });
  });
});
