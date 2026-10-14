import { randomBytes, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { invitations, pageAssignments, socialPages, users } from "@/db/schema";
import { PAGE_CODES } from "@/domain/types";
import { can, isPublishingOperator } from "@/domain/permissions";
import type { PublicUser } from "@/server/accounts";
import { createAccount, hashToken, writeAudit } from "@/server/accounts";

const INVITE_DAYS = 7;

export async function pageCodesFor(user: PublicUser): Promise<string[]> {
  if (can(user.role, "view_all_pages") || can(user.role, "manage_plan") || can(user.role, "approve_content")) {
    return [...PAGE_CODES];
  }
  const rows = await getDb().select().from(pageAssignments).where(eq(pageAssignments.userId, user.id));
  return rows.map((row) => row.pageCode);
}

export async function assignmentView(user: PublicUser) {
  const pages = await getDb().select().from(socialPages);
  const own = await pageCodesFor(user);
  const visiblePages = pages
    .filter((page) => own.includes(page.code))
    .map((page) => ({ code: page.code, name: page.name, slug: page.slug, status: page.status }));
  if (isPublishingOperator(user.role) || !can(user.role, "manage_users")) {
    return { pages: visiblePages, operators: [] as OperatorAssignment[] };
  }
  const accounts = await getDb().select().from(users);
  const links = await getDb().select().from(pageAssignments);
  const operators = accounts
    .filter((account) => isPublishingOperator(account.role as PublicUser["role"]))
    .map((account) => ({
      id: account.id,
      name: account.name,
      email: account.email,
      disabled: Boolean(account.disabledAt),
      pageCodes: links.filter((link) => link.userId === account.id).map((link) => link.pageCode),
    }));
  return { pages: pages.map((page) => ({ code: page.code, name: page.name, slug: page.slug, status: page.status })), operators };
}

type OperatorAssignment = {
  id: string;
  name: string;
  email: string;
  disabled: boolean;
  pageCodes: string[];
};

export async function setPageAssignment(actor: PublicUser, userId: string, pageCode: string, assigned: boolean) {
  if (!can(actor.role, "manage_users")) return { ok: false as const, error: "Only the owner can assign Pages." };
  if (!PAGE_CODES.includes(pageCode as (typeof PAGE_CODES)[number])) return { ok: false as const, error: "That Page is not in the catalogue." };
  const db = getDb();
  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target || !isPublishingOperator(target.role as PublicUser["role"])) {
    return { ok: false as const, error: "Pages are assigned to publishing operators." };
  }
  if (assigned) {
    await db
      .insert(pageAssignments)
      .values({ id: randomUUID(), userId, pageCode, assignedBy: actor.id, assignedAt: new Date() })
      .onConflictDoNothing();
  } else {
    await db.delete(pageAssignments).where(and(eq(pageAssignments.userId, userId), eq(pageAssignments.pageCode, pageCode)));
  }
  await writeAudit(actor.id, assigned ? "ASSIGN_PAGE" : "UNASSIGN_PAGE", "page_assignment", pageCode, { userId });
  return { ok: true as const };
}

export async function createInvitation(actor: PublicUser, input: { name: string; email: string; pageCodes: string[] }) {
  if (!can(actor.role, "manage_users")) return { ok: false as const, error: "Only the owner can invite an operator." };
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, error: "Enter a valid email." };
  if (input.name.trim().length < 2) return { ok: false as const, error: "Enter the person's name." };
  const pageCodes = [...new Set(input.pageCodes)];
  if (pageCodes.some((code) => !PAGE_CODES.includes(code as (typeof PAGE_CODES)[number]))) {
    return { ok: false as const, error: "Choose Pages from the catalogue." };
  }
  const token = randomBytes(32).toString("base64url");
  await getDb().insert(invitations).values({
    id: randomUUID(),
    email,
    name: input.name.trim(),
    tokenHash: hashToken(token),
    pageCodes,
    expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
    acceptedAt: null,
    createdBy: actor.id,
    createdAt: new Date(),
  });
  await writeAudit(actor.id, "INVITE_OPERATOR", "invitation", email, { pageCodes });
  return { ok: true as const, acceptPath: `/join?token=${token}` };
}

export async function acceptInvitation(token: string, password: string) {
  const [invite] = await getDb().select().from(invitations).where(eq(invitations.tokenHash, hashToken(token)));
  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "This invitation is not valid." };
  }
  const personKey = `op${randomBytes(4).toString("hex")}`;
  const created = await createAccount({
    personKey,
    email: invite.email,
    name: invite.name,
    role: "PUBLISHING_OPERATOR",
    password,
  });
  if (!created.ok) return created;
  const db = getDb();
  for (const pageCode of invite.pageCodes) {
    await db.insert(pageAssignments).values({
      id: randomUUID(),
      userId: created.user.id,
      pageCode,
      assignedBy: invite.createdBy,
      assignedAt: new Date(),
    });
  }
  await db.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invite.id));
  await writeAudit(created.user.id, "ACCEPT_INVITE", "invitation", invite.id, {});
  return { ok: true as const, user: created.user };
}
