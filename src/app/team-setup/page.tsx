import Link from "next/link";
import { ParticipantShell } from "@/components/participant-shell";
import { requireParticipant, getParticipantTeamState } from "@/lib/guards";

export default async function TeamSetupPage() {
  const user = await requireParticipant();
  const state = await getParticipantTeamState(user.id);

  const identity = {
    initials: user.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() ?? "")
      .join("") || "P",
    roleLabel: state.state === "approved" && state.team?.leaderId === user.id ? "Team Leader" : state.state === "approved" ? "Team Member" : state.state === "pending" ? "Join Pending" : "Participant",
    displayName: user.fullName,
  };

  if (state.state === "approved" && state.teamId) {
    return (
      <ParticipantShell identity={identity}>
        <div className="max-w-3xl">
          <section className="card p-6">
            <h1 className="text-2xl font-bold">Team already configured</h1>
            <p className="mt-2 text-sm text-muted">You are already in an approved team.</p>
            <Link href={`/team/${state.teamId}`} className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">Go to Team Dashboard</Link>
          </section>
        </div>
      </ParticipantShell>
    );
  }

  if (state.state === "pending") {
    return (
      <ParticipantShell identity={identity}>
        <div className="max-w-3xl space-y-6">
          <section className="card p-6">
            <h1 className="text-2xl font-bold">Join request pending</h1>
            <p className="mt-2 text-sm text-muted">You already have a pending request waiting for team leader approval.</p>
            <span className="mt-4 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Pending badge</span>
          </section>
          {state.team && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold">Pending Team Preview</h2>
              <p className="mt-2 text-sm text-muted">{state.team.name} is waiting for leader approval.</p>
            </section>
          )}
        </div>
      </ParticipantShell>
    );
  }

  return (
    <ParticipantShell identity={identity}>
      <div className="max-w-3xl space-y-6">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Team Setup (Required)</h1>
          <p className="mt-2 text-sm text-muted">Create a team or join one using team code before accessing your dashboard.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/team-setup/create" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">Create Team</Link>
            <Link href="/team-setup/join" className="rounded-full border border-border bg-surface-2 px-5 py-2.5 text-sm font-semibold">Join Team</Link>
          </div>
        </section>
      </div>
    </ParticipantShell>
  );
}
