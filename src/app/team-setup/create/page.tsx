import { redirect } from "next/navigation";
import { TeamMemberStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";
import { makeTeamCode } from "@/lib/security";
import { formErrorClass, formFieldClass, getFormErrorMessage, normalizeFormValue } from "@/lib/utils";

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
  const teamName = normalizeFormValue(formData.get("teamName"));

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

  const errorMessage = getFormErrorMessage(error, {
    missing_name: "Please enter a team name.",
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Create Team</h1>
          {error && <p className={formErrorClass}>{errorMessage}</p>}
          <form action={createTeam} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium">
              <span>Team Name *</span>
              <input name="teamName" required placeholder="Enter your team name" className={formFieldClass} />
            </label>
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Create Team</button>
          </form>
        </section>
      </main>
    </div>
  );
}
