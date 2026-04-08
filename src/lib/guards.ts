import { redirect } from "next/navigation";
import { ApprovalStatus, TeamMemberStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getOrganizerSession, getParticipantSession } from "@/lib/auth";

export type AccessRole = "PARTICIPANT" | "TEAM_LEADER" | "TEAM_MEMBER" | "ORGANIZER";

export async function getUserAccessRoles(userId: string): Promise<AccessRole[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { participant: true, organizerProfile: true },
  });

  if (!user) {
    return [];
  }

  const roles = new Set<AccessRole>();

  if (user.participant) {
    roles.add("PARTICIPANT");
  }

  if (user.organizerProfile) {
    roles.add("ORGANIZER");
  }

  const approvedMembership = await prisma.teamMember.findFirst({
    where: { userId, status: TeamMemberStatus.APPROVED },
    include: { team: true },
  });

  if (approvedMembership) {
    roles.add("TEAM_MEMBER");
    if (approvedMembership.team?.leaderId === userId) {
      roles.add("TEAM_LEADER");
    }
  }

  return [...roles];
}

export async function requireParticipant() {
  const session = await getParticipantSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { participant: true },
  });

  if (!user) {
    redirect("/login");
  }

  const accessRoles = await getUserAccessRoles(user.id);
  const isParticipantSideAllowed = accessRoles.includes("PARTICIPANT") || accessRoles.includes("TEAM_LEADER") || accessRoles.includes("TEAM_MEMBER");

  if (!isParticipantSideAllowed) {
    redirect("/login");
  }

  return user;
}

export async function requireOrganizer() {
  const session = await getOrganizerSession();
  if (!session) {
    redirect("/organizer/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organizerProfile: true },
  });

  if (!user) {
    redirect("/organizer/login");
  }

  const accessRoles = await getUserAccessRoles(user.id);
  if (!accessRoles.includes("ORGANIZER")) {
    redirect("/organizer/login");
  }

  return user;
}

export async function requireApprovedOrganizer() {
  const user = await requireOrganizer();
  if (!user.organizerProfile || user.organizerProfile.status !== ApprovalStatus.APPROVED) {
    redirect("/organizer/pending");
  }
  return user;
}

export async function getParticipantTeamState(userId: string) {
  const approvedMembership = await prisma.teamMember.findFirst({
    where: { userId, status: TeamMemberStatus.APPROVED },
    include: { team: true },
  });

  if (approvedMembership) {
    return { state: "approved" as const, teamId: approvedMembership.teamId, team: approvedMembership.team };
  }

  const pendingMembership = await prisma.teamMember.findFirst({
    where: { userId, status: TeamMemberStatus.PENDING },
    include: { team: true },
  });

  if (pendingMembership) {
    return { state: "pending" as const, teamId: pendingMembership.teamId, team: pendingMembership.team };
  }

  return { state: "none" as const, teamId: null, team: null };
}

