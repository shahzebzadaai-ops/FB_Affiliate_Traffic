"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAGE_IDENTITIES } from "@/domain/pages";

type Account = {
  id: string;
  name: string;
  email: string;
  role: string;
  personKey: string;
  disabled: boolean;
};

type OperatorRow = {
  id: string;
  name: string;
  email: string;
  disabled: boolean;
  pageCodes: string[];
};

export function StaffAdmin({
  initialUsers,
  initialOperators,
}: {
  initialUsers: Account[];
  initialOperators: OperatorRow[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [operators, setOperators] = useState(initialOperators);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function reload() {
    const [staffResponse, assignmentResponse] = await Promise.all([
      fetch("/api/staff", { cache: "no-store" }),
      fetch("/api/assignments", { cache: "no-store" }),
    ]);
    if (!staffResponse.ok || !assignmentResponse.ok) {
      setError("Operators could not be loaded.");
      return;
    }
    const staffBody = (await staffResponse.json()) as { users: Account[] };
    const assignmentBody = (await assignmentResponse.json()) as { operators: OperatorRow[] };
    setUsers(staffBody.users);
    setOperators(assignmentBody.operators);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">Owner</p>
        <h1 className="mt-2 font-heading text-5xl tracking-tight">Operators</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Invite a publishing operator and assign Pages. They set their own password. They cannot see other operators, finance, or AI spend.
        </p>
      </header>
      <form
        className="space-y-4 border-y py-6"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const pageCodes = PAGE_IDENTITIES.filter((page) => data.get(page.code) === "on").map((page) => page.code);
          void fetch("/api/staff/invitations", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: data.get("name"), email: data.get("email"), pageCodes }),
          }).then(async (response) => {
            const body = (await response.json()) as { error?: string; acceptPath?: string };
            if (!response.ok || !body.acceptPath) {
              setError(body.error ?? "The invitation was not created.");
              return;
            }
            setError(null);
            setNotice(`Give them this link once. It is not shown again. ${window.location.origin}${body.acceptPath}`);
            form.reset();
          });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Name<input required name="name" className="mt-1 h-11 w-full border border-border bg-card px-3" /></label>
          <label className="text-sm">Email<input required name="email" type="email" className="mt-1 h-11 w-full border border-border bg-card px-3" /></label>
        </div>
        <fieldset className="text-sm">
          <legend className="text-muted-foreground">Pages on this invitation</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {PAGE_IDENTITIES.map((page) => (
              <label key={page.code} className="inline-flex items-center gap-2">
                <input type="checkbox" name={page.code} />
                {page.name}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="h-11 bg-primary px-4 text-sm font-medium text-primary-foreground">Create invitation</button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="max-w-3xl text-sm break-all">{notice}</p> : null}
      <section>
        <h2 className="font-heading text-3xl tracking-tight">Page assignments</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr className="border-b">
                <th className="py-3 pr-3 font-medium">Operator</th>
                {PAGE_IDENTITIES.map((page) => (
                  <th key={page.code} className="py-3 pr-3 font-medium">{page.code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operators.map((operator) => (
                <tr key={operator.id} className="border-b">
                  <td className="py-3 pr-3">
                    <p className="font-medium">{operator.name}</p>
                    <p className="text-muted-foreground">{operator.disabled ? "Disabled" : operator.email}</p>
                  </td>
                  {PAGE_IDENTITIES.map((page) => {
                    const checked = operator.pageCodes.includes(page.code);
                    return (
                      <td key={page.code} className="py-3 pr-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={operator.disabled}
                          aria-label={`${operator.name} ${page.name}`}
                          onChange={(event) => {
                            void fetch("/api/assignments", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ userId: operator.id, pageCode: page.code, assigned: event.target.checked }),
                            }).then(() => reload());
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {operators.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No publishing operators yet.</p> : null}
      </section>
      <ul className="divide-y border-y text-sm">
        {users.filter((user) => user.role !== "SUPER_ADMIN").map((user) => (
          <li key={user.id} className="flex items-center justify-between gap-3 py-3">
            <span>{user.name} · {user.role}{user.disabled ? " · disabled" : ""}</span>
            {!user.disabled ? (
              <button
                type="button"
                className="text-primary"
                onClick={() => {
                  void fetch("/api/staff/disable", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ userId: user.id }),
                  }).then(() => reload());
                }}
              >
                Disable
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
