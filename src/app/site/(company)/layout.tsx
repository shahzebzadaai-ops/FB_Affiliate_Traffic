import { Suspense, type ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export default function CompanyLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="grove"><p className="grove-kicker">Loading</p></div>}>
      <SiteShell>{children}</SiteShell>
    </Suspense>
  );
}
