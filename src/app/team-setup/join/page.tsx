import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ParticipantShell } from "@/components/participant-shell";
import { TeamMemberStatus, TeamStatus } from "@/lib/domain";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { buildAlertUrl } from "@/lib/alerts";
import { formErrorClass, formFieldClass, formSuccessClass, getFormErrorMessage, normalizeFormValue } from "@/lib/utils";

const MAX_TEAM_SIZE = 4;

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

  const team = await prisma.team.findUnique({
    where: { code },
    include: {
      leader: true,
      members: { include: { user: true }, orderBy: { requestedAt: "asc" } },
    },
  });

  if (!team || team.status !== TeamStatus.DRAFT) {
    redirect(`/team-setup/join?code=${code}&error=not_found`);
  }

  const existingMembers = team.members.filter((member: { status: TeamMemberStatus }) => member.status === TeamMemberStatus.APPROVED || member.status === TeamMemberStatus.PENDING).length;
  if (existingMembers >= MAX_TEAM_SIZE) {
    redirect(`/team-setup/join?code=${code}&error=team_full`);
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

  redirect(buildAlertUrl(`/team-setup/join?code=${code}&joined=1`, {
    variant: "info",
    title: "Join request sent.",
    message: "Your request has been submitted to the team leader.",
    hint: "You will see the pending badge until it is reviewed.",
  }));
}

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JoinTeamPage({ searchParams }: SearchProps) {
  const user = await requireParticipant();
  const teamState = await getParticipantTeamState(user.id);
  if (teamState.state === "approved" && teamState.teamId) {
    redirect(`/team/${teamState.teamId}`);
  }
  if (teamState.state === "pending") {
    redirect(`/team-setup?status=pending&teamId=${teamState.teamId}`);
  }

  const params = await searchParams;
  const error = String(params.error ?? "");
  const code = String(params.code ?? "").toUpperCase();
  const joined = String(params.joined ?? "") === "1";
  const identity = {
    initials: user.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() ?? "")
      .join("") || "P",
    roleLabel: "Participant",
    displayName: user.fullName,
  };

  const errorMessage = getFormErrorMessage(error, {
    missing_code: "Please enter a team code.",
    invalid_code: "Please enter a valid 6-character team code.",
    not_found: "No draft team was found for that code.",
    team_full: "This team already has four members or pending requests.",
  });

  const team = code
    ? await prisma.team.findUnique({
        where: { code },
        include: {
          leader: true,
          members: { include: { user: true }, orderBy: { requestedAt: "asc" } },
        },
      })
    : null;
  const confirmedCount = team?.members.filter((member: { status: TeamMemberStatus }) => member.status === TeamMemberStatus.APPROVED).length ?? 0;
  const pendingCount = team?.members.filter((member: { status: TeamMemberStatus }) => member.status === TeamMemberStatus.PENDING).length ?? 0;
  const availableSlots = team ? Math.max(0, MAX_TEAM_SIZE - confirmedCount - pendingCount) : 0;
  const showPreview = Boolean(team);
  const canJoin = Boolean(team && team.status === TeamStatus.DRAFT && availableSlots > 0 && !joined);

  return (
    <ParticipantShell identity={identity}>
      <section className="space-y-6">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Join Team</h1>
          <p className="mt-2 text-sm text-muted">Enter a team code to preview the team before sending a join request.</p>
          {error && <p className={formErrorClass}>{errorMessage}</p>}
          {joined && <p className={formSuccessClass}>Join request sent.</p>}
          <form method="get" className="mt-4 flex flex-wrap gap-3">
            <label className="grid flex-1 gap-1 text-sm font-medium">
              <span>Team Code *</span>
              <input name="code" defaultValue={code} required maxLength={6} placeholder="HX92KL" className={`${formFieldClass} uppercase`} />
            </label>
            <button className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold">Preview Team</button>
          </form>
        </section>

        {showPreview && team && (
          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{team.name}</h2>
                <p className="mt-1 text-sm text-muted">Leader: {team.leader.fullName}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${team.status === TeamStatus.DRAFT ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
                {team.status === TeamStatus.DRAFT ? "Open" : "Locked"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Member Count</p>
                <p className="mt-2 text-lg font-semibold">{confirmedCount + pendingCount}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Available Slots</p>
                <p className="mt-2 text-lg font-semibold">{availableSlots}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                <p className="mt-2 text-lg font-semibold">{team.status}</p>
              </div>
            </div>

            {canJoin ? (
              <form action={requestJoin} className="mt-5">
                <input type="hidden" name="teamCode" value={team.code} />
                <FormSubmitButton pendingLabel="Sending request..." className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Join Team</FormSubmitButton>
              </form>
            ) : (
              <p className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">This team is not available for new join requests.</p>
            )}

            {joined && <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">Pending badge applied to this request.</p>}
          </section>
        )}
      </section>
    </ParticipantShell>
  );
}