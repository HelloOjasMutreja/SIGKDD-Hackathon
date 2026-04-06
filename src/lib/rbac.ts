export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  CHECKIN_STAFF: "CHECKIN_STAFF",
  TRACK_MANAGER: "TRACK_MANAGER",
  MENTOR_JUDGE: "MENTOR_JUDGE",
  SUPPORT_STAFF: "SUPPORT_STAFF",
  PARTICIPANT: "PARTICIPANT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

const permissionMap: Record<string, Role[]> = {
  "registration:read": [
    ROLES.SUPER_ADMIN,
    ROLES.SUPPORT_STAFF,
    ROLES.CHECKIN_STAFF,
    ROLES.TRACK_MANAGER,
    ROLES.MENTOR_JUDGE,
  ],
  "registration:manage": [ROLES.SUPER_ADMIN, ROLES.SUPPORT_STAFF],
  "team:manage": [ROLES.SUPER_ADMIN, ROLES.SUPPORT_STAFF, ROLES.TRACK_MANAGER],
  "track:manage": [ROLES.SUPER_ADMIN, ROLES.TRACK_MANAGER],
  "checkin:write": [ROLES.SUPER_ADMIN, ROLES.CHECKIN_STAFF],
  "judging:write": [ROLES.SUPER_ADMIN, ROLES.MENTOR_JUDGE],
};

export function hasPermission(role: Role, permission: string): boolean {
  const allowedRoles = permissionMap[permission] ?? [];
  return allowedRoles.includes(role);
}
