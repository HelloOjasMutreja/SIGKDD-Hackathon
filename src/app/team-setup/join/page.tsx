import { redirect } from "next/navigation";
import { TeamMemberStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";
import { formErrorClass, formFieldClass, getFormErrorMessage, normalizeFormValue } from "@/lib/utils";

async function requestJoin(formData: FormData) {
  "use server";
  const user = await requireParticipant();
  const code = normalizeFormValue(formData.get("teamCode")).toUpperCase();

  if (!code) {
    redirect("/team-setup/join?error=missing_code");
  }

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

  const errorMessage = getFormErrorMessage(error, {
    missing_code: "Please enter a team code.",
    invalid_code: "Please enter a valid 6-character team code.",
    not_found: "No team was found for that code.",
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Join Team</h1>
          <p className="mt-2 text-sm text-muted">Enter a 6-character team code.</p>
          {error && <p className={formErrorClass}>{errorMessage}</p>}
          <form action={requestJoin} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-medium">
              <span>Team Code *</span>
              <input name="teamCode" required maxLength={6} placeholder="HX92KL" className={`${formFieldClass} uppercase`} />
            </label>
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Request to Join</button>
          </form>
        </section>
      </main>
    </div>
  );
}
