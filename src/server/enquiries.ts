import { createHash, randomUUID } from "node:crypto";
import { can } from "@/domain/permissions";
import type { Role } from "@/domain/types";
import { getSql } from "@/db/client";
import { CAREERS_TOPICS, CONTACT_TOPICS, type EnquiryKind } from "@/site/enquiry-fields";

const LIMIT = 5;

export type EnquiryRow = {
  id: string;
  kind: EnquiryKind;
  name: string;
  email: string;
  topic: string;
  message: string;
  created_at: Date;
};

export type EnquiryInput = {
  kind?: unknown;
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
  consent?: unknown;
  fax?: unknown;
};

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip || "unknown").digest("hex");
}

export async function submitPublicEnquiry(
  input: EnquiryInput,
  ip: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const sql = getSql();
  const ipHash = hashIp(ip);
  await sql`insert into public_enquiry_attempts (ip_hash) values (${ipHash})`;
  const [recent] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from public_enquiry_attempts
    where ip_hash = ${ipHash}
      and created_at > now() - interval '1 hour'
  `;
  if ((recent?.n ?? 0) > LIMIT) {
    return { ok: false, status: 429, error: "Too many messages from this network. Wait an hour and try again." };
  }

  if (clean(input.fax, 200) !== "") return { ok: true };

  const kind = input.kind === "careers" || input.kind === "contact" ? input.kind : "";
  if (!kind) return { ok: false, status: 400, error: "Choose the contact form or the careers form." };
  const name = clean(input.name, 80);
  if (name.length < 2) return { ok: false, status: 400, error: "Enter your name." };
  const email = clean(input.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, status: 400, error: "Enter a valid email address." };
  const topic = clean(input.topic, 80);
  const allowed: readonly string[] = kind === "careers" ? CAREERS_TOPICS : CONTACT_TOPICS;
  if (!allowed.includes(topic)) {
    return { ok: false, status: 400, error: "Choose a subject from the list." };
  }
  const message = clean(input.message, 2000);
  if (message.length < 10) return { ok: false, status: 400, error: "Write a message of at least 10 characters." };
  if (input.consent !== true) return { ok: false, status: 400, error: "Consent is required before a message can be stored." };

  await sql`
    insert into public_enquiries (id, kind, name, email, topic, message)
    values (${randomUUID()}, ${kind}, ${name}, ${email}, ${topic}, ${message})
  `;
  return { ok: true };
}

export async function listPublicEnquiries(
  role: Role,
): Promise<{ ok: true; rows: EnquiryRow[] } | { ok: false; error: string }> {
  if (!can(role, "manage_users")) return { ok: false, error: "You cannot read public enquiries." };
  const rows = await getSql()<EnquiryRow[]>`
    select id, kind, name, email, topic, message, created_at
    from public_enquiries
    order by created_at desc
    limit 100
  `;
  return { ok: true, rows };
}
