import { beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase, resetDatabase, seedDatabase } from "@/db/setup";
import { getSql } from "@/db/client";
import { financeResponse } from "@/server/finance";
import { createAccount } from "@/server/accounts";
import { acceptInvitation, assignmentView, createInvitation, pageCodesFor, setPageAssignment } from "@/server/access";
import { loadWork, saveTask } from "@/server/work";
import { can } from "@/domain/permissions";

const databaseUrl = process.env.DATABASE_URL ?? "";

beforeAll(async () => {
  await migrateDatabase(databaseUrl);
  await resetDatabase(databaseUrl);
  await seedDatabase(databaseUrl);
}, 120_000);

describe("operator isolation", () => {
  it("keeps three operators on separate Pages and out of finance", async () => {
    const owner = await createAccount({
      personKey: "shahzeb",
      email: "owner@example.com",
      name: "Shahzeb",
      role: "SUPER_ADMIN",
      password: "owner-test-password",
    });
    expect(owner.ok).toBe(true);
    if (!owner.ok) return;

    const invites = [
      { name: "Operator A", email: "a@example.com", pageCodes: ["BGUK"] },
      { name: "Operator B", email: "b@example.com", pageCodes: ["SGIUK"] },
      { name: "Operator C", email: "c@example.com", pageCodes: [] as string[] },
    ];
    const operators = [];
    for (const invite of invites) {
      const created = await createInvitation(owner.user, invite);
      expect(created.ok).toBe(true);
      if (!created.ok) return;
      const token = new URL(`http://local${created.acceptPath}`).searchParams.get("token") ?? "";
      const accepted = await acceptInvitation(token, "operator-test-password");
      expect(accepted.ok).toBe(true);
      if (!accepted.ok) return;
      operators.push(accepted.user);
    }
    const [operatorA, operatorB, operatorC] = operators;
    if (!operatorA || !operatorB || !operatorC) return;

    expect(operatorA.role).toBe("PUBLISHING_OPERATOR");
    expect(await pageCodesFor(operatorA)).toEqual(["BGUK"]);
    expect(await pageCodesFor(operatorB)).toEqual(["SGIUK"]);
    expect(await pageCodesFor(operatorC)).toEqual([]);

    const workA = await loadWork(operatorA);
    expect(workA.visibleContentIds.every((id) => id.includes("-BGUK-"))).toBe(true);
    expect(workA.visibleContentIds).toHaveLength(36);
    expect(workA.visibleContentIds).not.toContain("UK-SGIUK-001");
    expect(JSON.stringify(workA)).not.toContain(operatorB.name);
    expect(JSON.stringify(workA)).not.toContain(operatorB.email);
    expect(JSON.stringify(workA)).not.toContain("masho");
    expect(JSON.stringify(workA.records)).not.toContain(operatorB.name);

    const stolen = await saveTask(operatorA, "UK-SGIUK-001", { action: "start" });
    expect(stolen.ok).toBe(false);
    const workB = await loadWork(operatorB);
    expect(workB.states["UK-SGIUK-001"]?.status).toBe("ASSIGNED");

    expect(financeResponse(operatorA).status).toBe(403);
    expect(financeResponse(operatorB).status).toBe(403);
    expect(financeResponse(operatorC).status).toBe(403);
    expect(can(operatorA.role, "manage_users")).toBe(false);
    expect(can(operatorA.role, "view_finance")).toBe(false);

    const ownView = await assignmentView(operatorA);
    expect(ownView.operators).toEqual([]);
    expect(ownView.pages.map((page) => page.code)).toEqual(["BGUK"]);
    expect(JSON.stringify(ownView)).not.toContain(operatorB.name);

    expect((await setPageAssignment(operatorA, operatorB.id, "BGUK", true)).ok).toBe(false);
    expect((await setPageAssignment(owner.user, operatorA.id, "BGUK", false)).ok).toBe(true);
    expect((await setPageAssignment(owner.user, operatorB.id, "BGUK", true)).ok).toBe(true);
    expect(await pageCodesFor(operatorA)).toEqual([]);
    expect(await pageCodesFor(operatorB)).toEqual(expect.arrayContaining(["BGUK", "SGIUK"]));
    expect((await loadWork(operatorA)).visibleContentIds).toHaveLength(0);
    expect((await loadWork(operatorB)).visibleContentIds).toContain("UK-BGUK-001");

    const sql = getSql();
    const patch = JSON.stringify({ status: "APPROVED", assetReference: "https://files.example/reel.mp4" });
    await sql`
      update task_states
      set state = state || ${patch}::jsonb
      where content_id = 'UK-SGIUK-001'
    `;
    const scheduled = await saveTask(operatorB, "UK-SGIUK-001", { action: "confirmScheduled" });
    expect(scheduled.ok).toBe(true);
    if (scheduled.ok) {
      expect(scheduled.state.status).toBe("SCHEDULED");
      expect(scheduled.state.facebookUrl).toBe("");
      expect(scheduled.state.scheduledConfirmedAt).toBeTruthy();
    }
    const tooSoon = await saveTask(operatorB, "UK-BGUK-001", { action: "confirmScheduled" });
    expect(tooSoon.ok).toBe(false);
    const published = await saveTask(operatorB, "UK-SGIUK-001", { action: "publish", facebookUrl: "https://www.facebook.com/stillgotit/posts/1" });
    expect(published.ok).toBe(true);
    if (published.ok) {
      expect(published.state.status).toBe("PUBLISHED");
      expect(JSON.stringify(published.state)).not.toContain(operatorA.personKey);
    }

    const issue = await saveTask(operatorB, "UK-BGUK-002", { action: "reportIssue", note: "The file will not download." });
    expect(issue.ok).toBe(true);
    if (issue.ok) expect(issue.state.publicationIssue?.note).toContain("download");

    expect((await saveTask(operatorA, "UK-BGUK-001", { action: "reportIssue", note: "Operator A should not be able to write this." })).ok).toBe(false);
    const ownerWork = await loadWork(owner.user);
    const operatorWork = await loadWork(operatorB);
    expect(ownerWork.states["UK-SGIUK-001"]?.revisions.some((revision) => revision.actorId === operatorB.personKey)).toBe(true);
    expect(operatorWork.states["UK-SGIUK-001"]?.revisions.every((revision) => revision.actorId === operatorB.personKey || revision.actorId === "operator")).toBe(true);
    expect(JSON.stringify(operatorWork.states["UK-SGIUK-001"])).not.toContain(operatorA.personKey);
  });
});
