import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/current-user";
import { canEnterOwner } from "@/server/task-commands";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 font-heading text-3xl">AffiGrove OS</p>}>
      <OwnerGate>{children}</OwnerGate>
    </Suspense>
  );
}

async function OwnerGate({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canEnterOwner(user.role)) redirect("/staff");
  return <AppShell area="owner">{children}</AppShell>;
}
