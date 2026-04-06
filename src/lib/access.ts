import { Role } from "@prisma/client";

const permissionMap: Record<string, Role[]> = {
  "registration:read": [
    Role.SUPER_ADMIN,
    Role.SUPPORT_STAFF,
    Role.CHECKIN_STAFF,
    Role.TRACK_MANAGER,
    Role.MENTOR_JUDGE,
  ],
  "registration:manage": [Role.SUPER_ADMIN, Role.SUPPORT_STAFF],
  "team:manage": [Role.SUPER_ADMIN, Role.SUPPORT_STAFF, Role.TRACK_MANAGER, Role.PARTICIPANT],
  "track:manage": [Role.SUPER_ADMIN, Role.TRACK_MANAGER],
  "checkin:write": [Role.SUPER_ADMIN, Role.CHECKIN_STAFF],
  "admin:access": [Role.SUPER_ADMIN, Role.SUPPORT_STAFF],
};

export function can(role: Role, permission: string): boolean {
  return (permissionMap[permission] ?? []).includes(role);
}

export function canAny(role: Role, roles: Role[]): boolean {
  return roles.includes(role);
}
