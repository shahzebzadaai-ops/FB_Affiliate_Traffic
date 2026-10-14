import { Suspense } from "react";
import { redirect } from "next/navigation";
import { StaffAdmin } from "@/components/staff-admin";
import { can } from "@/domain/permissions";
import { assignmentView } from "@/server/access";
import { listAccounts } from "@/server/accounts";
import { getCurrentUser } from "@/server/current-user";

export default function StaffAdminPage() {
  return (
    <Suspense fallback={<p className="font-heading text-3xl">Staff</p>}>
      <StaffAdminGate />
    </Suspense>
  );
}

async function StaffAdminGate() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!can(user.role, "manage_users")) redirect("/staff");
  const users = await listAccounts();
  const assignments = await assignmentView(user);
  return <StaffAdmin initialUsers={users} initialOperators={assignments.operators} />;
}
