"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrandLockup } from "@/components/brand-lockup";

export function PublicBody() {
  useEffect(() => {
    document.body.classList.add("grove-open");
    return () => document.body.classList.remove("grove-open");
  }, []);
  return null;
}

const LINKS = [
  { href: "/site", label: "Home" },
  { href: "/site/about", label: "About" },
  { href: "/site/what-we-do", label: "What we do" },
  { href: "/site/approach", label: "Approach" },
  { href: "/site/careers", label: "Careers" },
  { href: "/site/contact", label: "Contact" },
];

function current(pathname: string, href: string): boolean {
  if (href === "/site") return pathname === "/site";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  return (
    <div className="grove">
      <a className="grove-skip" href="#content">
        Skip to content
      </a>
      <header className="grove-header">
        <div className="grove-wrap grove-header-inner">
          <Link href="/site" className="grove-brand">
            <BrandLockup kind="affigrove" />
          </Link>
          <button
            type="button"
            className="grove-menu"
            aria-expanded={open}
            aria-controls="grove-nav"
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            {open ? "Close" : "Menu"}
          </button>
          <nav id="grove-nav" className={open ? "grove-nav is-open" : "grove-nav"} aria-label="Primary">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} aria-current={current(pathname, link.href) ? "page" : undefined}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="content" className="grove-main">
        <div className="grove-wrap">{children}</div>
      </main>
      <footer className="grove-footer">
        <div className="grove-wrap grove-footer-grid">
          <div>
            <h2>AffiGrove Media Group</h2>
            <p>Thoughtful media. Meaningful connections.</p>
          </div>
          <nav aria-label="Legal and contact">
            <Link href="/site/contact">Contact</Link>
            <Link href="/site/careers">Careers</Link>
            <Link href="/site/privacy">Privacy</Link>
            <Link href="/site/terms">Terms</Link>
          </nav>
        </div>
        <div className="grove-wrap">
          <small>
            Intended public addresses: affigrove.io and www.affigrove.io. Company number, registered office, public email, and phone are awaiting approval.
          </small>
        </div>
      </footer>
    </div>
  );
}
