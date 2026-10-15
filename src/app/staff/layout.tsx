import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BrandLockup } from "@/components/brand-lockup";
import { getCurrentUser } from "@/server/current-user";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8"><BrandLockup kind="os" className="h-8 w-auto" /></div>}>
      <StaffGate>{children}</StaffGate>
    </Suspense>
  );
}

async function StaffGate({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <AppShell area="staff">{children}</AppShell>;
}
