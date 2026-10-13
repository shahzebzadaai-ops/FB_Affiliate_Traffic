"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Account = {
  id: string;
  name: string;
  email: string;
  role: string;
  personKey: string;
  disabled: boolean;
};

export function StaffAdmin({ initialUsers }: { initialUsers: Account[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function reload() {
    const response = await fetch("/api/staff", { cache: "no-store" });
    if (!response.ok) {
      setError("Staff accounts could not be loaded.");
      return;
    }
    const body = (await response.json()) as { users: Account[] };
    setUsers(body.users);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-5xl tracking-tight">Staff</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Invite Masho with his own password. There is no public registration and no shared owner password.
        </p>
      </header>
      <form
        className="grid gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void fetch("/api/staff", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: data.get("name"),
              email: data.get("email"),
              password: data.get("password"),
              personKey: data.get("personKey"),
              role: "CONTENT_OPERATOR",
            }),
          }).then(async (response) => {
            const body = (await response.json()) as { error?: string };
            if (!response.ok) {
              setError(body.error ?? "The account was not created.");
              return;
            }
            setError(null);
            setNotice("Account created. Give Masho the password you chose. It is not shown again.");
            event.currentTarget.reset();
            await reload();
          });
        }}
      >
        <label className="text-sm">Name<input required name="name" defaultValue="Masho" className="mt-1 h-11 w-full rounded-lg border border-border px-3" /></label>
        <label className="text-sm">Email<input required name="email" type="email" className="mt-1 h-11 w-full rounded-lg border border-border px-3" /></label>
        <label className="text-sm">Person key<input required name="personKey" defaultValue="masho" className="mt-1 h-11 w-full rounded-lg border border-border px-3" /></label>
        <label className="text-sm">Initial password<input required name="password" type="password" minLength={12} className="mt-1 h-11 w-full rounded-lg border border-border px-3" /></label>
        <button type="submit" className="h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground sm:col-span-2">
          Create content operator
        </button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="text-sm">{notice}</p> : null}
      <ul className="divide-y divide-border rounded-xl bg-card ring-1 ring-foreground/10">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email} · {user.role} · {user.personKey}{user.disabled ? " · disabled" : ""}</p>
            </div>
            {user.role !== "SUPER_ADMIN" && !user.disabled ? (
              <button
                type="button"
                className="text-sm text-primary"
                onClick={() => {
                  void fetch("/api/staff/disable", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ userId: user.id }),
                  }).then(() => reload());
                }}
              >
                Disable account
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
