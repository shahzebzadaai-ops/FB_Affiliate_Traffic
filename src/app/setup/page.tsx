import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SetupForm } from "@/components/auth-forms";
import { countUsers } from "@/server/accounts";
import { getCurrentUser } from "@/server/current-user";
import { canEnterOwner } from "@/server/task-commands";

export default function SetupPage() {
  return (
    <Suspense fallback={<p className="grid min-h-screen place-items-center font-heading text-3xl">Affiliate Traffic OS</p>}>
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
