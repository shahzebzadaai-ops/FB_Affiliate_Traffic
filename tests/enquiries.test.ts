import { beforeAll, describe, expect, it } from "vitest";
import { migrateDatabase, resetDatabase, seedDatabase } from "@/db/setup";
import { getSql } from "@/db/client";
import { createAccount } from "@/server/accounts";
import { listPublicEnquiries, submitPublicEnquiry } from "@/server/enquiries";

const databaseUrl = process.env.DATABASE_URL ?? "";

beforeAll(async () => {
  await migrateDatabase(databaseUrl);
  await resetDatabase(databaseUrl);
  await seedDatabase(databaseUrl);
}, 120_000);

describe("public enquiries", () => {
  it("stores a consented message and refuses a hollow one", async () => {
    const missing = await submitPublicEnquiry(
      { kind: "contact", name: "A", email: "not-an-email", topic: "General", message: "short", consent: false },
      "203.0.113.10",
    );
    expect(missing.ok).toBe(false);

    const stored = await submitPublicEnquiry(
      {
        kind: "careers",
        name: "Ada Enquiry",
        email: "ada@example.com",
        topic: "Internship enquiry",
        message: "I would like to ask about a future internship.",
        consent: true,
      },
      "203.0.113.11",
    );
    expect(stored).toEqual({ ok: true });
    const [row] = await getSql()<{ n: number }[]>`
      select count(*)::int as n from public_enquiries where email = 'ada@example.com'
    `;
    expect(row?.n).toBe(1);
  });

  it("does not store a honeypot submission", async () => {
    const result = await submitPublicEnquiry(
      {
        kind: "contact",
        name: "Bot",
        email: "bot@example.com",
        topic: "General",
        message: "This should be discarded.",
        consent: true,
        fax: "555",
      },
      "203.0.113.12",
    );
    expect(result).toEqual({ ok: true });
    const [row] = await getSql()<{ n: number }[]>`select count(*)::int as n from public_enquiries where email = 'bot@example.com'`;
    expect(row?.n).toBe(0);
  });

  it("limits repeated submissions and keeps them away from operators", async () => {
    const input = {
      kind: "contact" as const,
      name: "Rate Limit",
      email: "limit@example.com",
      topic: "Press",
      message: "Please record this press enquiry.",
      consent: true,
    };
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await submitPublicEnquiry(input, "203.0.113.13")).ok).toBe(true);
    }
    const blocked = await submitPublicEnquiry(input, "203.0.113.13");
    expect(blocked).toEqual({ ok: false, status: 429, error: "Too many messages from this network. Wait an hour and try again." });

    const owner = await createAccount({
      personKey: "shahzeb",
      email: "owner-enquiry@example.com",
      name: "Shahzeb",
      role: "SUPER_ADMIN",
      password: "owner-test-password",
    });
    expect(owner.ok).toBe(true);
    const operator = await createAccount({
      personKey: "operator-enquiry",
      email: "operator-enquiry@example.com",
      name: "Operator",
      role: "PUBLISHING_OPERATOR",
      password: "staff-test-password",
    });
    expect(operator.ok).toBe(true);
    expect((await listPublicEnquiries("PUBLISHING_OPERATOR")).ok).toBe(false);
    const visible = await listPublicEnquiries("SUPER_ADMIN");
    expect(visible.ok).toBe(true);
    if (visible.ok) expect(visible.rows.some((row) => row.email === "ada@example.com")).toBe(true);

    const [campaign] = await getSql()<{ status: string; started_at: Date | null }[]>`
      select status, started_at from campaigns where id = 'uk-month-one'
    `;
    expect(campaign?.status).toBe("BUILD");
    expect(campaign?.started_at).toBeNull();
  });
});
