import Link from "next/link";
import { ParticipantShell } from "@/components/participant-shell";
import { TeamMemberStatus, TeamStatus } from "@/lib/domain";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

function getIdentity(fullName: string, roleLabel: string) {
  return {
    initials:
      fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "P",
    roleLabel,
    displayName: fullName,
  };
}

export default async function ParticipantDashboardPage() {
  const user = await requireParticipant();
  const teamState = await getParticipantTeamState(user.id);
  const team = teamState.teamId
    ? await prisma.team.findUnique({
        where: { id: teamState.teamId },
        include: {
          leader: true,
          members: {
            include: { user: { include: { participant: true } } },
            orderBy: { requestedAt: "asc" },
          },
          track: true,
        },
      })
    : null;

  const roleLabel = teamState.state === "approved" && team?.leaderId === user.id ? "Team Leader" : teamState.state === "approved" ? "Team Member" : teamState.state === "pending" ? "Join Pending" : "Participant";
  const identity = getIdentity(user.fullName, roleLabel);
  const approvedMemberCount = team?.members.filter((member: { status: TeamMemberStatus }) => member.status === TeamMemberStatus.APPROVED).length ?? 0;
  const pendingMemberCount = team?.members.filter((member: { status: TeamMemberStatus }) => member.status === TeamMemberStatus.PENDING).length ?? 0;
  const canEdit = team?.status === TeamStatus.DRAFT;
  const teamLink = teamState.teamId ? `/team/${teamState.teamId}` : "/team-setup";
  const teamLinkLabel = teamState.state === "none" ? "Create or join a team" : "Open team dashboard";

  return (
    <ParticipantShell identity={identity}>
      <section className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Participant Home</p>
            <h1 className="mt-2 text-3xl font-bold">Your hackathon workspace</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted">Use this dashboard to manage your team, monitor submission status, and jump to the next required action.</p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Team State</p>
                <p className="mt-2 text-lg font-semibold">{teamState.state === "none" ? "No team yet" : team?.status ?? "Pending"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Members</p>
                <p className="mt-2 text-lg font-semibold">{approvedMemberCount}/{team ? 4 : 4}</p>
                <p className="text-xs text-muted">{pendingMemberCount} pending requests</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Submission</p>
                <p className="mt-2 text-lg font-semibold">{team?.status === TeamStatus.SUBMITTED ? "Submitted" : team?.status === TeamStatus.DRAFT ? "Draft" : team?.status ?? "Not started"}</p>
                <p className="text-xs text-muted">{canEdit ? "Editing is open" : "Details are locked"}</p>
              </div>
            </div>
          </div>

          <aside className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Quick Actions</p>
            <div className="mt-4 grid gap-3 text-sm">
              <Link href={teamLink} className="rounded-xl border border-border bg-surface-2 px-4 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                {teamLinkLabel}
              </Link>
              <Link href="/profile" className="rounded-xl border border-border bg-surface-2 px-4 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                Edit profile
              </Link>
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="font-semibold">Current participant</p>
                <p className="mt-1 text-sm text-muted">{user.fullName}</p>
                <p className="mt-1 text-xs text-muted">{identity.roleLabel}</p>
              </div>
            </div>
          </aside>
        </div>

        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Team Snapshot</p>
              <h2 className="mt-2 text-xl font-bold">Current team status</h2>
            </div>
            {teamState.state === "pending" && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Join request pending</span>}
          </div>

          {team ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm">
                <p className="font-semibold">Team name</p>
                <p className="mt-1 text-muted">{team.name}</p>
                <p className="mt-3 font-semibold">Leader</p>
                <p className="mt-1 text-muted">{team.leader.fullName}</p>
                <p className="mt-3 font-semibold">Track</p>
                <p className="mt-1 text-muted">{team.track?.name ?? "Not assigned"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm">
                <p className="font-semibold">Team members</p>
                <ul className="mt-2 grid gap-2">
                  {team.members.map((member: { id: string; user: { fullName: string }; status: TeamMemberStatus }) => (
                    <li key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                      <span>{member.user.fullName}</span>
                      <span className="text-xs text-muted">{member.status.toLowerCase()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted">No team yet. Create or join a team to continue.</p>
          )}
        </section>
      </section>
    </ParticipantShell>
  );
}