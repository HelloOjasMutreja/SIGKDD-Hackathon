import Link from "next/link";
import { TeamStatus } from "@/lib/domain";
import { OrganizerShell } from "@/components/organizer-shell";
import { requireApprovedOrganizer } from "@/lib/guards";
import { canUseOrganizerCapability } from "@/lib/org-access";

export default async function OrgDashboardPage() {
  const user = await requireApprovedOrganizer();
  const approvedRole = user.organizerProfile?.approvedRole ?? null;

  const [totalRegistrations, teamsDraft, teamsSubmitted, teamsApproved, tracks, qrReady, reviewsWithScores, checkins, meals] = await Promise.all([
    (await import("@/lib/prisma")).prisma.participantProfile.count(),
    (await import("@/lib/prisma")).prisma.team.count({ where: { status: TeamStatus.DRAFT } }),
    (await import("@/lib/prisma")).prisma.team.count({ where: { status: TeamStatus.SUBMITTED } }),
    (await import("@/lib/prisma")).prisma.team.count({ where: { status: TeamStatus.APPROVED } }),
    (await import("@/lib/prisma")).prisma.track.findMany({ include: { _count: { select: { teams: true } } } }),
    (await import("@/lib/prisma")).prisma.team.count({ where: { status: TeamStatus.APPROVED, qrToken: { not: null } } }),
    (await import("@/lib/prisma")).prisma.team.count({ where: { reviewScore: { not: null } } }),
    (await import("@/lib/prisma")).prisma.checkin.count(),
    (await import("@/lib/prisma")).prisma.scanEvent.count({ where: { eventType: "MEAL" } }),
  ]);

  const canReview = canUseOrganizerCapability(user.role, approvedRole, "teams:review");
  const canScan = canUseOrganizerCapability(user.role, approvedRole, "scanner:use");
  const canManageRoles = canUseOrganizerCapability(user.role, approvedRole, "roles:manage");
  const canViewAnalytics = canUseOrganizerCapability(user.role, approvedRole, "analytics:view");

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Organizer Dashboard</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Hackathon operations hub for submissions, QR, check-ins, meals, and role control.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#17324d]">
            <span className="rounded-full border border-[#cdd8e5] px-3 py-1">{approvedRole ?? user.role}</span>
            <span className="rounded-full border border-[#cdd8e5] px-3 py-1">Review access: {canReview ? "Yes" : "No"}</span>
            <span className="rounded-full border border-[#cdd8e5] px-3 py-1">Scanner access: {canScan ? "Yes" : "No"}</span>
            <span className="rounded-full border border-[#cdd8e5] px-3 py-1">Role admin: {canManageRoles ? "Yes" : "No"}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Total Registrations</p><p className="text-2xl font-bold">{totalRegistrations}</p></article>
          <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Teams in Draft</p><p className="text-2xl font-bold">{teamsDraft}</p></article>
          <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Teams Submitted</p><p className="text-2xl font-bold">{teamsSubmitted}</p></article>
          <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Teams Approved</p><p className="text-2xl font-bold">{teamsApproved}</p></article>
        </div>

        {canViewAnalytics && (
          <div className="grid gap-4 md:grid-cols-4">
            <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">QR Ready</p><p className="text-2xl font-bold">{qrReady}</p></article>
            <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Reviewed With Scores</p><p className="text-2xl font-bold">{reviewsWithScores}</p></article>
            <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Check-ins</p><p className="text-2xl font-bold">{checkins}</p></article>
            <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Meal Scans</p><p className="text-2xl font-bold">{meals}</p></article>
          </div>
        )}

        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#17324d]">Quick Links</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/organizer/teams" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Teams & Review</Link>
            <Link href="/organizer/scanner" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Scanner</Link>
            <Link href="/organizer/operations" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Operations</Link>
            <Link href="/organizer/roles" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Roles</Link>
            <Link href="/organizer/admin/approvals" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Organizer Approvals</Link>
            <Link href="/organizer/admin/tracks" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Tracks</Link>
          </div>
        </div>
      </section>
    </OrganizerShell>
  );
}

