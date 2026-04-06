import { OrganizerApprovedRole, UserRole } from "@prisma/client";

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
