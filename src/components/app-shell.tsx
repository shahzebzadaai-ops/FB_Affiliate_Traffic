"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { staffById } from "@/domain/people";
import { usePreview, type PreviewIdentityId } from "@/preview/preview-context";

const STAFF_LINKS = [
  { href: "/staff", label: "Today" },
  { href: "/staff/calendar", label: "Calendar" },
  { href: "/staff/training", label: "Training" },
  { href: "/staff/pages", label: "Pages" },
];

const OWNER_LINKS = [
  { href: "/owner", label: "Company" },
  { href: "/owner/calendar", label: "Calendar" },
  { href: "/owner/approvals", label: "Approvals" },
  { href: "/owner/pages", label: "Pages" },
  { href: "/owner/import", label: "Import" },
  { href: "/owner/training", label: "Training" },
  { href: "/owner/integrations", label: "Systems" },
  { href: "/owner/affiliate", label: "Finance" },
];

export function PreviewGate() {
  const preview = usePreview();
  const router = useRouter();

  if (!preview.ready) return <Wordmark />;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-16">
      <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Internal operating system</p>
      <h1 className="mt-3 font-heading text-5xl tracking-tight text-foreground sm:text-6xl">Affiliate Traffic OS</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Organic Facebook publishing for five UK audiences, then an owned comparison path, then approved PPS commission.
        This screen is a development preview, not a login.
      </p>
      <div className="mt-8 rounded-xl border border-amber-700/20 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
        Development preview identities. There is no password, no account, and no production authentication. Do not enter real secrets here.
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <IdentityCard
          name="Shahzeb"
          role="Super Admin preview"
          detail="Company progress, approvals, the content calendar and the future finance area. No revenue is invented."
          onEnter={() => {
            preview.enter("shahzeb");
            router.push("/owner");
          }}
        />
        <IdentityCard
          name="Masho"
          role="Content Operator preview"
          detail="Today's assigned production only. Affiliate earnings, payouts and admin settings stay hidden."
          onEnter={() => {
            preview.enter("masho");
            router.push("/staff");
          }}
        />
      </div>
      <button
        type="button"
        className="mt-6 self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
        onClick={preview.resetWork}
      >
        Reset preview work on this browser
      </button>
    </main>
  );
}

function IdentityCard({
  name,
  role,
  detail,
  onEnter,
}: {
  name: string;
  role: string;
  detail: string;
  onEnter: () => void;
}) {
  return (
    <article className="flex flex-col rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
      <h2 className="font-heading text-3xl">{name}</h2>
      <p className="mt-1 text-sm font-medium text-primary">{role}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
      <button
        type="button"
        onClick={onEnter}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Enter preview
      </button>
    </article>
  );
}

export function AppShell({
  area,
  children,
}: {
  area: "staff" | "owner";
  children: React.ReactNode;
}) {
  const preview = usePreview();
  const pathname = usePathname();
  const router = useRouter();
  const expected: PreviewIdentityId = area === "owner" ? "shahzeb" : "masho";

  useEffect(() => {
    if (!preview.ready) return;
    if (preview.identityId !== expected) {
      router.replace(preview.identityId === "shahzeb" ? "/owner" : preview.identityId === "masho" ? "/staff" : "/");
    }
  }, [expected, preview.identityId, preview.ready, router]);

  if (!preview.ready || preview.identityId !== expected) return <Wordmark />;

  const person = staffById(expected);
  const links = area === "owner" ? OWNER_LINKS : STAFF_LINKS;

  return (
    <div className="min-h-screen">
      <div className="border-b border-amber-700/20 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 sm:text-sm">
        Development preview for {person?.name}. This is not secure login and it is not connected to Facebook, Drive or an affiliate network.
      </div>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href={area === "owner" ? "/owner" : "/staff"} className="font-heading text-2xl tracking-tight">
              Affiliate Traffic OS
            </Link>
            <button type="button" onClick={preview.leave} className="text-sm text-muted-foreground hover:text-foreground">
              Leave preview
            </button>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}

function Wordmark() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <p className="font-heading text-3xl tracking-tight">Affiliate Traffic OS</p>
    </main>
  );
}
