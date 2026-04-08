import { OrganizerApprovedRole, UserRole } from "@/lib/domain";

export type OrganizerCapability =
  | "teams:view"
  | "teams:review"
  | "teams:approve"
  | "scanner:use"
  | "checkins:manage"
  | "meals:manage"
  | "roles:manage"
  | "analytics:view"
  | "submissions:view"
  | "submissions:score"
  | "settings:manage";

const ROLE_CAPABILITIES: Record<OrganizerApprovedRole, OrganizerCapability[]> = {
  [OrganizerApprovedRole.CORE_ORGANIZER]: [
    "teams:view",
    "teams:review",
    "teams:approve",
    "scanner:use",
    "checkins:manage",
    "meals:manage",
    "analytics:view",
    "submissions:view",
  ],
  [OrganizerApprovedRole.REVIEWER]: ["teams:view", "teams:review", "submissions:view", "submissions:score"],
  [OrganizerApprovedRole.CHECKIN_MANAGER]: ["scanner:use", "checkins:manage", "meals:manage"],
  [OrganizerApprovedRole.TECHNICAL_LEAD]: ["teams:view", "teams:review", "scanner:use", "checkins:manage", "analytics:view", "settings:manage"],
  [OrganizerApprovedRole.LOGISTICS]: ["scanner:use", "checkins:manage", "meals:manage"],
  [OrganizerApprovedRole.VOLUNTEER]: ["scanner:use", "checkins:manage", "meals:manage"],
  [OrganizerApprovedRole.PR_MARKETING]: [],
};

export function hasOrgRole(
  userRole: UserRole,
  approvedRole: OrganizerApprovedRole | null,
  allowed: Array<UserRole | OrganizerApprovedRole>,
): boolean {
  if (allowed.includes(userRole)) {
    return true;
  }
  if (approvedRole && allowed.includes(approvedRole)) {
    return true;
  }
  return false;
}

export function canUseOrganizerCapability(
  userRole: UserRole,
  approvedRole: OrganizerApprovedRole | null,
  capability: OrganizerCapability,
): boolean {
  if (userRole === UserRole.ADMIN) {
    return true;
  }

  if (!approvedRole) {
    return false;
  }

  return ROLE_CAPABILITIES[approvedRole]?.includes(capability) ?? false;
}
