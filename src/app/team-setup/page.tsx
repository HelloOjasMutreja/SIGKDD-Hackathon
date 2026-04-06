import Link from "next/link";
import { requireParticipant, getParticipantTeamState } from "@/lib/guards";

export default async function TeamSetupPage() {
  const user = await requireParticipant();
  const state = await getParticipantTeamState(user.id);

  if (state.state === "approved" && state.teamId) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-3xl px-6 py-10">
          <section className="card p-6">
            <h1 className="text-2xl font-bold">Team already configured</h1>
            <p className="mt-2 text-sm text-muted">You are already in an approved team.</p>
            <Link href={`/team/${state.teamId}`} className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">Go to Team Dashboard</Link>
          </section>
        </main>
      </div>
    );
  }

  if (state.state === "pending") {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-3xl px-6 py-10">
          <section className="card p-6">
            <h1 className="text-2xl font-bold">Join request pending</h1>
            <p className="mt-2 text-sm text-muted">You already have a pending request waiting for team leader approval.</p>
            <Link href="/team-setup/pending" className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white">View pending status</Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Team Setup (Required)</h1>
          <p className="mt-2 text-sm text-muted">Create a team or join one using team code before accessing your dashboard.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/team-setup/create" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">Create Team</Link>
            <Link href="/team-setup/join" className="rounded-full border border-border bg-surface-2 px-5 py-2.5 text-sm font-semibold">Join Team</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
