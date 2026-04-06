import Link from "next/link";
import { TeamStatus } from "@prisma/client";
import { OrganizerShell } from "@/components/organizer-shell";
import { requireApprovedOrganizer } from "@/lib/guards";

export default async function OrgDashboardPage() {
  await requireApprovedOrganizer();

  const [totalRegistrations, teamsDraft, teamsSubmitted, tracks] = await Promise.all([
    (await import("@/lib/prisma")).prisma.participantProfile.count(),
    (await import("@/lib/prisma")).prisma.team.count({ where: { status: TeamStatus.DRAFT } }),
    (await import("@/lib/prisma")).prisma.team.count({ where: { status: TeamStatus.SUBMITTED } }),
    (await import("@/lib/prisma")).prisma.track.findMany({ include: { _count: { select: { teams: true } } } }),
  ]);

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Organizer Dashboard</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Event overview and operational quick links.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Total Registrations</p><p className="text-2xl font-bold">{totalRegistrations}</p></article>
          <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Teams in Draft</p><p className="text-2xl font-bold">{teamsDraft}</p></article>
          <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Teams Submitted</p><p className="text-2xl font-bold">{teamsSubmitted}</p></article>
          <article className="rounded-xl border border-[#cdd8e5] bg-white p-4"><p className="text-xs text-[#4f647b]">Tracks</p><p className="text-2xl font-bold">{tracks.length}</p></article>
        </div>

        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#17324d]">Quick Links</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/org/teams" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Teams</Link>
            <Link href="/org/admin/approvals" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Approvals</Link>
            <Link href="/org/checkin" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Check-in</Link>
            <Link href="/org/admin/tracks" className="rounded-full border border-[#cdd8e5] px-4 py-2 text-sm">Tracks</Link>
          </div>
        </div>
      </section>
    </OrganizerShell>
  );
}
