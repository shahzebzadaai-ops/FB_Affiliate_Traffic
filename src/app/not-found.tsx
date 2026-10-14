"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function NotFound() {
  const pathname = usePathname() ?? "";
  const corporate = pathname.startsWith("/site");

  useEffect(() => {
    if (!corporate) return;
    document.body.classList.add("grove-open");
    return () => document.body.classList.remove("grove-open");
  }, [corporate]);

  if (corporate) {
    return (
      <div className="grove">
        <main className="grove-main">
          <div className="grove-wrap grove-prose">
            <p className="grove-kicker">Missing page</p>
            <h1>That page is not on this site.</h1>
            <p>The address does not match a public AffiGrove page.</p>
            <div className="grove-actions">
              <Link className="grove-button" href="/site">
                Back to the home page
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-heading text-4xl">Page not found</h1>
      <p className="mt-4 text-muted-foreground">That address is not in AffiGrove OS.</p>
      <Link className="atos-btn mt-6" href="/">
        Back to sign in
      </Link>
    </main>
  );
}
