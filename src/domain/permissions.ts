import type { Role } from "@/domain/types";

export const CAPABILITIES = [
  "view_assigned_work",
  "submit_work",
  "approve_content",
  "view_all_pages",
  "manage_plan",
  "view_finance",
  "manage_postbacks",
  "manage_users",
  "view_staff_admin",
  "view_training_completion",
  "view_page_analytics",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  SUPER_ADMIN: CAPABILITIES,
  ADMIN: [
    "view_assigned_work",
    "submit_work",
    "approve_content",
    "view_all_pages",
    "manage_plan",
    "view_page_analytics",
    "view_training_completion",
    "manage_users",
  ],
  CONTENT_MANAGER: [
    "view_assigned_work",
    "submit_work",
    "approve_content",
    "view_all_pages",
    "manage_plan",
    "view_page_analytics",
    "view_training_completion",
  ],
  CONTENT_OPERATOR: ["view_assigned_work", "submit_work"],
  PUBLISHING_OPERATOR: ["view_assigned_work", "submit_work"],
  DESIGNER: ["view_assigned_work", "submit_work"],
  VIDEO_EDITOR: ["view_assigned_work", "submit_work"],
  AFFILIATE_MANAGER: ["view_finance", "manage_postbacks", "view_page_analytics"],
  ANALYST: ["view_all_pages", "view_page_analytics", "view_training_completion"],
};

export function capabilitiesFor(role: Role): readonly Capability[] {
  return ROLE_CAPABILITIES[role];
}

export function can(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function canApproveOwnWork(): boolean {
  return false;
}

export function isPublishingOperator(role: Role): boolean {
  return role === "PUBLISHING_OPERATOR" || role === "CONTENT_OPERATOR";
}
