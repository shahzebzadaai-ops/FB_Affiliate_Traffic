import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/current-user";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 font-heading text-3xl">AffiGrove OS</p>}>
      <StaffGate>{children}</StaffGate>
    </Suspense>
  );
}

async function StaffGate({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return <AppShell area="staff">{children}</AppShell>;
}
