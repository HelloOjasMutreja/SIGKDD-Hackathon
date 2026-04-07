import { redirect } from "next/navigation";
import { TeamMemberStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";
import { makeTeamCode } from "@/lib/security";

async function generateUniqueTeamCode(): Promise<string> {
  for (let i = 0; i < 10; i += 1) {
    const code = makeTeamCode();
    const exists = await prisma.team.findUnique({ where: { code } });
    if (!exists) {
      return code;
    }
  }
  throw new Error("Failed to generate unique team code");
}

async function createTeam(formData: FormData) {
  "use server";
  const user = await requireParticipant();
  const teamName = String(formData.get("teamName") ?? "").trim();

  if (!teamName) {
    redirect("/team-setup/create?error=missing_name");
  }

  const teamState = await getParticipantTeamState(user.id);
  if (teamState.state !== "none") {
    redirect("/team-setup");
  }

  const code = await generateUniqueTeamCode();

  const team = await prisma.team.create({
    data: {
      name: teamName,
      code,
      leaderId: user.id,
      status: "DRAFT",
      members: {
        create: {
          userId: user.id,
          status: TeamMemberStatus.APPROVED,
        },
      },
    },
  });

  redirect(`/team/${team.id}`);
}

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CreateTeamPage({ searchParams }: SearchProps) {
  await requireParticipant();
  const params = await searchParams;
  const error = String(params.error ?? "");

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Create Team</h1>
          {error && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Please provide team name.</p>}
          <form action={createTeam} className="mt-4 grid gap-3">
            <input name="teamName" required placeholder="Team Name" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Create Team</button>
          </form>
        </section>
      </main>
    </div>
  );
}
