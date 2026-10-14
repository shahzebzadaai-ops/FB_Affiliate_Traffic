import { readdirSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase, resetDatabase, seedDatabase } from "@/db/setup";
import { getSql } from "@/db/client";
import { financeResponse } from "@/server/finance";
import { authenticate, countUsers, createAccount, disableAccount, userFromToken } from "@/server/accounts";
import { loadWork, readCampaign, saveTask, saveTraining, startCampaign } from "@/server/work";
import { setPageAssignment } from "@/server/access";
import { decideTaskCommand } from "@/server/task-commands";
import { initialTaskState } from "@/preview/task-state";
import { hashPassword, verifyPassword } from "@/server/passwords";

const databaseUrl = process.env.DATABASE_URL ?? "";
const ownerPassword = "owner-test-password";
const staffPassword = "staff-test-password";

beforeAll(async () => {
  await migrateDatabase(databaseUrl);
  await resetDatabase(databaseUrl);
  await seedDatabase(databaseUrl);
}, 120_000);

describe("milestone A foundation", () => {
  it("keeps the 180-post plan and unresolved notes", async () => {
    const sql = getSql();
    const [countRow] = await sql<{ count: string }[]>`select count(*) from content_items`;
    const [unresolvedRow] = await sql<{ count: string }[]>`
      select count(*) from content_items where jsonb_array_length(unresolved) > 0
    `;
    const [publishedRow] = await sql<{ count: string }[]>`
      select count(*) from content_items where publication_status <> 'UNPUBLISHED'
    `;
    expect(Number(countRow?.count)).toBe(180);
    expect(Number(unresolvedRow?.count)).toBe(76);
    expect(Number(publishedRow?.count)).toBe(0);
  });

  it("seeds eight pillars and 64 unstarted actions", async () => {
    const sql = getSql();
    const [pillars] = await sql<{ count: string }[]>`select count(*) from mandala_pillars`;
    const [actions] = await sql<{ count: string }[]>`select count(*) from mandala_actions where status = 'NOT_STARTED'`;
    const [measured] = await sql<{ count: string }[]>`select count(*) from mandala_actions where latest_measurement is not null`;
    expect(Number(pillars?.count)).toBe(8);
    expect(Number(actions?.count)).toBe(64);
    expect(Number(measured?.count)).toBe(0);
  });

  it("hashes passwords and has no public registration route", async () => {
    const hash = await hashPassword(ownerPassword);
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword(ownerPassword, hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
    expect(readdirSync("src/app/api/auth").includes("register")).toBe(false);
  });

  it("bootstraps the owner once, then Masho, and keeps their permissions apart", async () => {
    expect(await countUsers()).toBe(0);
    const owner = await createAccount({
      personKey: "shahzeb",
      email: "affiliateshahzeb@gmail.com",
      name: "Shahzeb",
      role: "SUPER_ADMIN",
      password: ownerPassword,
    });
    expect(owner.ok).toBe(true);
    const duplicate = await createAccount({
      personKey: "shahzeb",
      email: "other@example.com",
      name: "Other",
      role: "SUPER_ADMIN",
      password: ownerPassword,
    });
    expect(duplicate.ok).toBe(false);
    const masho = await createAccount({
      personKey: "masho",
      email: "masho@example.com",
      name: "Masho",
      role: "CONTENT_OPERATOR",
      password: staffPassword,
    });
    expect(masho.ok).toBe(true);
    if (!owner.ok || !masho.ok) return;

    expect(financeResponse(masho.user).status).toBe(403);
    expect(financeResponse(owner.user).body.approvedRevenue).toBeNull();
    const pages = ["BGUK", "AHSUK", "SPSUK", "SGIUK", "CBCUK"];
    const denied = decideTaskCommand(masho.user, "SGIUK", pages, "masho", initialTaskState(), { action: "approve", comment: "Looks good" }, new Date().toISOString());
    expect(denied.ok).toBe(false);
    const flagged = decideTaskCommand(
      masho.user,
      "SGIUK",
      pages,
      "masho",
      initialTaskState(),
      { action: "flagRegeneration", note: "The voice is American and the hands are wrong." },
      "2026-10-13T12:00:00.000Z",
    );
    expect(flagged.ok).toBe(true);
    if (flagged.ok) {
      expect(flagged.state.status).toBe("ASSIGNED");
      expect(flagged.state.regenerationRequest?.note).toContain("American");
    }

    const ownerSession = await authenticate(owner.user.email, ownerPassword, "test");
    const staffSession = await authenticate(masho.user.email, staffPassword, "test");
    expect(ownerSession.ok && staffSession.ok).toBe(true);
    if (!ownerSession.ok || !staffSession.ok) return;

    for (const code of pages) {
      expect((await setPageAssignment(owner.user, masho.user.id, code, true)).ok).toBe(true);
    }
    const saved = await saveTask(masho.user, "UK-SGIUK-001", { action: "toggle", kind: "checklist", id: "read-brief", value: true });
    expect(saved.ok).toBe(true);
    const loaded = await loadWork(masho.user);
    expect(loaded.states["UK-SGIUK-001"]?.checklist["read-brief"]).toBe(true);
    expect(loaded.visibleContentIds).toHaveLength(180);

    expect((await setPageAssignment(owner.user, masho.user.id, "CBCUK", false)).ok).toBe(true);
    const hidden = await saveTask(masho.user, "UK-CBCUK-036", { action: "start" });
    expect(hidden.ok).toBe(false);
    const after = await loadWork(masho.user);
    expect(after.visibleContentIds).not.toContain("UK-CBCUK-036");

    await saveTraining(masho.user, "masho:lesson-1", true);
    const trained = await loadWork(masho.user);
    expect(trained.training["masho:lesson-1"]).toBe(true);

    expect((await startCampaign(masho.user, true)).ok).toBe(false);
    expect((await startCampaign(owner.user, false)).ok).toBe(false);
    expect((await readCampaign()).status).toBe("BUILD");

    await disableAccount(masho.user.id, owner.user.id);
    expect(await userFromToken(staffSession.token)).toBeNull();
    expect(await userFromToken(ownerSession.token)).not.toBeNull();
  });
});
