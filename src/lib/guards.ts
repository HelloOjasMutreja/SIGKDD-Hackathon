import { redirect } from "next/navigation";
import { ApprovalStatus, TeamMemberStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getOrganizerSession, getParticipantSession } from "@/lib/auth";

export async function requireParticipant() {
  const session = await getParticipantSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { participant: true },
  });

  if (!user || user.role !== "PARTICIPANT") {
    redirect("/login");
  }

  return user;
}

export async function requireOrganizer() {
  const session = await getOrganizerSession();
  if (!session) {
    redirect("/org/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organizerProfile: true },
  });

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    redirect("/org/login");
  }

  return user;
}

export async function requireApprovedOrganizer() {
  const user = await requireOrganizer();
  if (!user.organizerProfile || user.organizerProfile.status !== ApprovalStatus.APPROVED) {
    redirect("/org/pending");
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
