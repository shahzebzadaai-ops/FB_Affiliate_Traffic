import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { getDb, getSql } from "@/db/client";
import { loginAttempts, sessions, users } from "@/db/schema";
import type { Role } from "@/domain/types";
import { hashPassword, passwordError, verifyPassword } from "@/server/passwords";

export type PublicUser = {
  id: string;
  personKey: string;
  email: string;
  name: string;
  role: Role;
  disabled: boolean;
};

const SESSION_DAYS = 14;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function countUsers(): Promise<number> {
  const [row] = await getDb().select({ value: count() }).from(users);
  return Number(row?.value ?? 0);
}

export async function createAccount(input: {
  personKey: string;
  email: string;
  name: string;
  role: Role;
  password: string;
}): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const passwordProblem = passwordError(input.password);
  if (passwordProblem) return { ok: false, error: passwordProblem };
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  if (input.name.trim().length < 2) return { ok: false, error: "Enter the person's name." };
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(input.personKey)) return { ok: false, error: "Person key must be lowercase letters, numbers or hyphens." };
  try {
    const [created] = await getDb()
      .insert(users)
      .values({
        id: randomUUID(),
        personKey: input.personKey,
        email,
        name: input.name.trim(),
        role: input.role,
        passwordHash: await hashPassword(input.password),
        disabledAt: null,
        createdAt: new Date(),
      })
      .returning();
    if (!created) return { ok: false, error: "The account was not created." };
    return { ok: true, user: toPublic(created) };
  } catch {
    return { ok: false, error: "That email or person key is already in use." };
  }
}

export async function listAccounts(): Promise<PublicUser[]> {
  const rows = await getDb().select().from(users);
  return rows.map(toPublic);
}

export async function disableAccount(userId: string, actorId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (userId === actorId) return { ok: false, error: "You cannot disable your own account." };
  const [row] = await getDb().select().from(users).where(eq(users.id, userId));
  if (!row) return { ok: false, error: "That account does not exist." };
  await getDb().update(users).set({ disabledAt: new Date() }).where(eq(users.id, userId));
  await getDb().update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, userId));
  await writeAudit(actorId, "DISABLE_USER", "user", userId, {});
  return { ok: true };
}

export async function authenticate(
  email: string,
  password: string,
  ip: string,
): Promise<{ ok: true; user: PublicUser; token: string } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  if (await isLocked(normalized, ip)) return { ok: false, error: "Too many attempts. Wait fifteen minutes and try again." };
  const [row] = await getDb().select().from(users).where(eq(users.email, normalized));
  const matches = row ? await verifyPassword(password, row.passwordHash) : false;
  await getSql()`insert into login_attempts (email, ip, succeeded) values (${normalized}, ${ip}, ${matches && !row?.disabledAt})`;
  if (!row || !matches || row.disabledAt) return { ok: false, error: "Email or password is wrong." };
  const token = randomBytes(32).toString("base64url");
  const user = toPublic(row);
  await getDb().insert(sessions).values({
    id: randomUUID(),
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
  });
  await writeAudit(user.id, "LOGIN", "session", user.id, {});
  return { ok: true, user, token };
}

export async function userFromToken(token: string | undefined): Promise<PublicUser | null> {
  if (!token) return null;
  const [session] = await getDb().select().from(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) return null;
  const [row] = await getDb().select().from(users).where(eq(users.id, session.userId));
  if (!row || row.disabledAt) return null;
  return toPublic(row);
}

export async function revokeToken(token: string | undefined) {
  if (!token) return;
  await getDb().update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function writeAudit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  detail: Record<string, unknown>,
) {
  const sql = getSql();
  await sql`insert into audit_events (actor_id, action, entity_type, entity_id, detail) values (${actorId}, ${action}, ${entityType}, ${entityId}, ${JSON.stringify(detail)}::jsonb)`;
}

async function isLocked(email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const [byEmail] = await getDb()
    .select({ value: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), eq(loginAttempts.succeeded, false), gt(loginAttempts.createdAt, since)));
  const [byIp] = await getDb()
    .select({ value: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.succeeded, false), gt(loginAttempts.createdAt, since)));
  return Number(byEmail?.value ?? 0) >= 8 || Number(byIp?.value ?? 0) >= 8;
}

function toPublic(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    personKey: row.personKey,
    email: row.email,
    name: row.name,
    role: row.role as Role,
    disabled: Boolean(row.disabledAt),
  };
}
