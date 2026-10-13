"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePreview, ownerArea } from "@/preview/preview-context";

const STAFF_LINKS = [
  { href: "/staff", label: "Today" },
  { href: "/staff/calendar", label: "Calendar" },
  { href: "/staff/training", label: "Training" },
  { href: "/staff/pages", label: "Pages" },
];

const OWNER_LINKS = [
  { href: "/owner", label: "Company" },
  { href: "/owner/mandala", label: "Mandala" },
  { href: "/owner/calendar", label: "Calendar" },
  { href: "/owner/approvals", label: "Approvals" },
  { href: "/owner/pages", label: "Pages" },
  { href: "/owner/import", label: "Import" },
  { href: "/owner/training", label: "Training" },
  { href: "/owner/integrations", label: "Systems" },
  { href: "/owner/staff", label: "Staff" },
  { href: "/owner/affiliate", label: "Finance" },
];

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
  const allowed = area === "owner" ? ownerArea(preview.user?.role) : Boolean(preview.user);

  useEffect(() => {
    if (!preview.ready) return;
    if (!preview.user) router.replace("/");
    else if (!allowed) router.replace(ownerArea(preview.user.role) ? "/owner" : "/staff");
  }, [allowed, preview.ready, preview.user, router]);

  if (!preview.ready || !preview.user || !allowed) return <Wordmark />;

  const links = area === "owner" ? OWNER_LINKS : STAFF_LINKS;

  return (
    <div className="min-h-screen">
      <div className="border-b border-amber-700/20 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 sm:text-sm">
        Signed in as {preview.user.name}. AI production, Facebook, Drive and affiliate networks are not connected. Scheduling is manual in Meta Business Suite. No revenue is invented.
      </div>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href={area === "owner" ? "/owner" : "/staff"} className="font-heading text-2xl tracking-tight">
              Affiliate Traffic OS
            </Link>
            <button
              type="button"
              onClick={() => {
                void preview.logout().then(() => {
                  router.push("/");
                  router.refresh();
                });
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Log out
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
