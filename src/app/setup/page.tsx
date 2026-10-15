import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SetupForm } from "@/components/auth-forms";
import { BrandLockup } from "@/components/brand-lockup";
import { countUsers } from "@/server/accounts";
import { getCurrentUser } from "@/server/current-user";
import { canEnterOwner } from "@/server/task-commands";

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><BrandLockup kind="os" className="h-10 w-auto" /></div>}>
      <SetupGate />
    </Suspense>
  );
}

async function SetupGate() {
  const user = await getCurrentUser();
  if (user) redirect(canEnterOwner(user.role) ? "/owner" : "/staff");
  if ((await countUsers()) > 0) redirect("/");
  return <SetupForm />;
}
