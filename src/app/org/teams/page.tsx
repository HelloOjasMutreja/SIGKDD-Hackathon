import Link from "next/link";
import { TeamStatus } from "@/lib/domain";
import { OrganizerShell } from "@/components/organizer-shell";
import { requireApprovedOrganizer } from "@/lib/guards";
import { canUseOrganizerCapability } from "@/lib/org-access";
import { prisma } from "@/lib/prisma";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrgTeamsPage({ searchParams }: SearchProps) {
  const user = await requireApprovedOrganizer();
  if (!canUseOrganizerCapability(user.role, user.organizerProfile?.approvedRole ?? null, "teams:view")) {
    return (
      <OrganizerShell>
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Teams Management</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Access restricted to reviewers, core organizers, technical leads, and admins.</p>
        </section>
      </OrganizerShell>
    );
  }

  const params = await searchParams;
  const trackId = String(params.trackId ?? "");
  const status = String(params.status ?? "");

  const tracks = await prisma.track.findMany({ orderBy: { createdAt: "desc" } });

  const teams = await prisma.team.findMany({
    where: {
      trackId: trackId || undefined,
      status: status ? (status as TeamStatus) : undefined,
    },
    include: {
      leader: true,
      members: { where: { status: "APPROVED" } },
      track: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Teams Management</h1>
          <form className="mt-4 flex flex-wrap gap-3" method="get">
            <select name="trackId" defaultValue={trackId} className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm">
              <option value="">All Tracks</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
            <select name="status" defaultValue={status} className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm">
              <option value="">All Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            <button className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white">Apply</button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#cdd8e5] bg-white p-4">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#dde6f0]">
                <th className="py-2">Team</th>
                <th className="py-2">Leader</th>
                <th className="py-2">Members</th>
                <th className="py-2">Track</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
                <th className="py-2">Open</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-[#eef3f8]">
                  <td className="py-2">{team.name}</td>
                  <td className="py-2">{team.leader.fullName}</td>
                  <td className="py-2">{team.members.length}</td>
                  <td className="py-2">{team.track?.name ?? "-"}</td>
                  <td className="py-2">{team.status}</td>
                  <td className="py-2">{team.createdAt.toLocaleDateString()}</td>
                  <td className="py-2"><Link href={`/organizer/review?teamId=${team.id}`} className="text-[#17324d] underline">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </OrganizerShell>
  );
}

