import { connection } from "next/server";
import { redirect } from "next/navigation";
import { can } from "@/domain/permissions";
import { getCurrentUser } from "@/server/current-user";
import { listPublicEnquiries } from "@/server/enquiries";

const when = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/London",
});

export default async function EnquiriesPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user.role, "manage_users")) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-heading text-4xl">Enquiries</h1>
        <p className="mt-4 text-muted-foreground">Public website messages are limited to people who manage staff.</p>
      </section>
    );
  }
  const result = await listPublicEnquiries(user.role);
  const rows = result.ok ? result.rows : [];
  return (
    <section className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-heading text-4xl">Enquiries</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Messages from the public AffiGrove site. They are not published, and they are not an employment contract.
      </p>
      {rows.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No public messages yet.</p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {rows.map((row) => (
            <li key={row.id} className="atos-surface p-4">
              <p className="font-heading text-xl text-foreground">{row.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {row.email} · {row.kind} · {row.topic}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-foreground">{row.message}</p>
              <p className="mt-3 text-sm text-muted-foreground">{when.format(new Date(row.created_at))}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
