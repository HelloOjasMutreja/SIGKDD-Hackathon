import Link from "next/link";
import { redirect } from "next/navigation";
import { ParticipantShell } from "@/components/participant-shell";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";

export default async function ParticipantDashboardPage() {
  const user = await requireParticipant();
  const teamState = await getParticipantTeamState(user.id);

  if (teamState.state === "none") {
    redirect("/team-setup");
  }
  if (teamState.state === "pending") {
    redirect("/team-setup/pending");
  }

  return (
    <ParticipantShell>
      <section className="card p-6">
        <h1 className="text-2xl font-bold">Participant Dashboard</h1>
        <p className="mt-2 text-sm text-muted">Welcome back, {user.fullName}.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
            <p className="font-semibold">Team Status</p>
            <p className="mt-1 text-muted">You are currently linked to an approved team.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
            <p className="font-semibold">Next Step</p>
            <Link href={`/team/${teamState.teamId}`} className="mt-1 inline-block text-accent">Open Team Dashboard</Link>
          </div>
        </div>
      </section>
    </ParticipantShell>
  );
}
