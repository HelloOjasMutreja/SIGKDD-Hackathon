import { redirect } from "next/navigation";
import { TeamMemberStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";

async function requestJoin(formData: FormData) {
  "use server";
  const user = await requireParticipant();
  const code = String(formData.get("teamCode") ?? "").trim().toUpperCase();

  if (!/^[A-Z0-9]{6}$/.test(code)) {
    redirect("/team-setup/join?error=invalid_code");
  }

  const current = await getParticipantTeamState(user.id);
  if (current.state !== "none") {
    redirect("/team-setup");
  }

  const team = await prisma.team.findUnique({ where: { code } });
  if (!team) {
    redirect("/team-setup/join?error=not_found");
  }

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: user.id,
      },
    },
    update: {
      status: TeamMemberStatus.PENDING,
      respondedAt: null,
    },
    create: {
      teamId: team.id,
      userId: user.id,
      status: TeamMemberStatus.PENDING,
    },
  });

  redirect(`/team-setup/pending?teamId=${team.id}`);
}

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JoinTeamPage({ searchParams }: SearchProps) {
  await requireParticipant();
  const params = await searchParams;
  const error = String(params.error ?? "");

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Join Team</h1>
          <p className="mt-2 text-sm text-muted">Enter a 6-character team code.</p>
          {error && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Error: {error.replaceAll("_", " ")}</p>}
          <form action={requestJoin} className="mt-4 grid gap-3">
            <input name="teamCode" required maxLength={6} placeholder="Team Code (e.g., HX92KL)" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm uppercase" />
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Request to Join</button>
          </form>
        </section>
      </main>
    </div>
  );
}
