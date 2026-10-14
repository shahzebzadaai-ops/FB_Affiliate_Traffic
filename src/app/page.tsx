import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm, SetupForm } from "@/components/auth-forms";
import { countUsers } from "@/server/accounts";
import { getCurrentUser } from "@/server/current-user";
import { canEnterOwner } from "@/server/task-commands";

export default function Page() {
  return (
    <Suspense fallback={<p className="grid min-h-screen place-items-center font-heading text-3xl">AffiGrove OS</p>}>
      <HomeGate />
    </Suspense>
  );
}

async function HomeGate() {
  const user = await getCurrentUser();
  if (user) redirect(canEnterOwner(user.role) ? "/owner" : "/staff");
  if ((await countUsers()) === 0) return <SetupForm />;
  return <LoginForm />;
}
