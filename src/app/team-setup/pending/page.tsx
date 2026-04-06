import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamPendingPage({ searchParams }: SearchProps) {
  const user = await requireParticipant();
  const state = await getParticipantTeamState(user.id);

  if (state.state === "approved" && state.teamId) {
    redirect(`/team/${state.teamId}`);
  }

  const params = await searchParams;
  const teamIdParam = String(params.teamId ?? "");
  const inviteFlag = String(params.invite ?? "") === "1";

  const displayTeamId = teamIdParam || state.teamId || "";
  const pendingTeam = displayTeamId
    ? await prisma.team.findUnique({ where: { id: displayTeamId }, include: { leader: true } })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Join Request Pending</h1>
          {inviteFlag && pendingTeam && (
            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              You have been invited to join {pendingTeam.name} led by {pendingTeam.leader.fullName}. Your join request has been sent automatically.
            </p>
          )}
          {pendingTeam ? (
            <p className="mt-3 text-sm text-muted">Request sent to team leader of {pendingTeam.name}. Waiting for approval.</p>
          ) : (
            <p className="mt-3 text-sm text-muted">No pending request found. You can create or join a team.</p>
          )}
        </section>
      </main>
    </div>
  );
}
