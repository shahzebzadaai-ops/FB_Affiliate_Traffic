import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 font-heading text-3xl">Affiliate Traffic OS</p>}>
      <AppShell area="owner">{children}</AppShell>
    </Suspense>
  );
}