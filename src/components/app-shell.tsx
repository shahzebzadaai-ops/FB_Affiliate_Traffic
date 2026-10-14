"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePreview, ownerArea } from "@/preview/preview-context";

const STAFF_DAILY = [
  { href: "/staff", label: "Today" },
  { href: "/staff/ready", label: "Ready" },
  { href: "/staff/scheduled", label: "Scheduled" },
  { href: "/staff/published", label: "Published" },
  { href: "/staff/issues", label: "Issues" },
];

const STAFF_MORE = [
  { href: "/staff/calendar", label: "Calendar" },
  { href: "/staff/pages", label: "My Pages" },
  { href: "/staff/training", label: "Training" },
];

const OWNER_PRIMARY = [
  { href: "/owner", label: "Overview" },
  { href: "/owner/approvals", label: "Approvals" },
  { href: "/owner/affiliate", label: "Affiliate" },
  { href: "/owner/studio", label: "Content Studio" },
  { href: "/owner/growth", label: "Growth Director" },
  { href: "/owner/pages", label: "Pages" },
];

const OWNER_MORE = [
  { href: "/owner/calendar", label: "Calendar" },
  { href: "/owner/mandala", label: "Mandala" },
  { href: "/owner/staff", label: "Operators" },
  { href: "/owner/integrations", label: "Systems" },
  { href: "/owner/import", label: "Import" },
  { href: "/owner/training", label: "Training" },
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

  const primary = area === "owner" ? OWNER_PRIMARY : STAFF_DAILY;
  const more = area === "owner" ? OWNER_MORE : STAFF_MORE;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-[oklch(0.965_0.006_95)] lg:flex">
        <div className="px-5 pt-6">
          <Link href={area === "owner" ? "/owner" : "/staff"} className="font-heading text-2xl tracking-tight">
            Affiliate Traffic OS
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{area === "owner" ? "Owner" : "Publishing"}</p>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-6 overflow-y-auto px-3">
          <NavGroup links={primary} pathname={pathname} />
          <NavGroup links={more} pathname={pathname} />
        </nav>
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs leading-relaxed text-muted-foreground">Signed in as {preview.user.name}. AI, Meta, Drive and networks are not connected.</p>
          <Logout onClick={() => {
            void preview.logout().then(() => {
              router.push("/");
              router.refresh();
            });
          }} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="border-b border-border lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href={area === "owner" ? "/owner" : "/staff"} className="font-heading text-xl tracking-tight">Affiliate Traffic OS</Link>
            <Logout
              className="mt-0"
              onClick={() => {
                void preview.logout().then(() => {
                  router.push("/");
                  router.refresh();
                });
              }}
            />
          </div>
          <div className="flex gap-1 overflow-x-auto px-3 pb-3">
            {(area === "owner" ? primary : more).map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} pathname={pathname} compact />
            ))}
          </div>
        </header>
        <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground sm:px-8">
          AI production, Facebook, Drive and affiliate networks are not connected. Scheduling is manual in Meta Business Suite.
        </p>
        <main className={`mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 ${area === "staff" ? "pb-28 lg:pb-10" : ""}`}>{children}</main>
        {area === "staff" ? (
          <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card lg:hidden">
            {STAFF_DAILY.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} pathname={pathname} compact />
            ))}
          </nav>
        ) : null}
      </div>
    </div>
  );
}

function NavGroup({ links, pathname }: { links: { href: string; label: string }[]; pathname: string }) {
  return (
    <div className="flex flex-col">
      {links.map((link) => (
        <NavLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
      ))}
    </div>
  );
}

function NavLink({
  href,
  label,
  pathname,
  compact = false,
}: {
  href: string;
  label: string;
  pathname: string;
  compact?: boolean;
}) {
  const active = href === "/owner" || href === "/staff" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        compact
          ? `px-2 py-3 text-center text-[11px] tracking-wide ${active ? "text-primary" : "text-muted-foreground"}`
          : `border-l-2 px-3 py-2 text-sm ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`
      }
    >
      {label}
    </Link>
  );
}

function Logout({ onClick, className = "mt-3" }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${className} text-sm text-muted-foreground hover:text-foreground`}>
      Log out
    </button>
  );
}

function Wordmark() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <p className="font-heading text-3xl tracking-tight">Affiliate Traffic OS</p>
    </main>
  );
}
