import { can } from "@/domain/permissions";
import type { PublicUser } from "@/server/accounts";

export function financeResponse(user: PublicUser) {
  if (!can(user.role, "view_finance")) {
    return { status: 403 as const, body: { error: "Finance is owner-only." } };
  }
  return {
    status: 200 as const,
    body: {
      status: "NOT_CONNECTED" as const,
      approvedRevenue: null,
      receivedCash: null,
      commissions: null,
    },
  };
}
