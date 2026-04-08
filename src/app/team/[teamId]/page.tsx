import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TeamMemberStatus, TeamStatus } from "@/lib/domain";
import { ParticipantShell } from "@/components/participant-shell";
import { prisma } from "@/lib/prisma";
import { requireParticipant } from "@/lib/guards";

type PageProps = {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type TeamMemberWithUser = {
  id: string;
  status: TeamMemberStatus;
  userId: string;
  user: {
    fullName: string;
    participant?: {
      registerNumber?: string | null;
    } | null;
  };
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800 border-amber-300",
  SUBMITTED: "bg-blue-100 text-blue-800 border-blue-300",
  UNDER_REVIEW: "bg-indigo-100 text-indigo-800 border-indigo-300",
  SHORTLISTED: "bg-teal-100 text-teal-800 border-teal-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Not Submitted",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  APPROVED: "Approved",
};

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function decideJoinRequest(formData: FormData) {
  "use server";
  const user = await requireParticipant();
  const teamId = String(formData.get("teamId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const decision = String(formData.get("decision") ?? "reject");

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.leaderId !== user.id) {
    return;
  }

  await prisma.teamMember.update({
    where: { id: memberId },
    data: {
      status: decision === "approve" ? TeamMemberStatus.APPROVED : TeamMemberStatus.REJECTED,
      respondedAt: new Date(),
    },
  });

  revalidatePath(`/team/${teamId}`);
}

async function removeMember(formData: FormData) {
  "use server";
  const user = await requireParticipant();
  const teamId = String(formData.get("teamId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.leaderId !== user.id) {
    return;
  }

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member || member.userId === user.id) {
    return;
  }

  await prisma.teamMember.delete({ where: { id: memberId } });
  revalidatePath(`/team/${teamId}`);
}

async function updateTeamProject(formData: FormData) {
  "use server";
  const user = await requireParticipant();

  const teamId = String(formData.get("teamId") ?? "");
  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if (!team) {
    return;
  }

  if (team.leaderId !== user.id) {
    return;
  }

  const githubLink = String(formData.get("githubLink") ?? "").trim();
  const projectDescription = String(formData.get("projectDescription") ?? "").trim();
  const deployedLink = String(formData.get("deployedLink") ?? "").trim();

  if (!githubLink || !projectDescription) {
    redirect(`/team/${teamId}?error=project_required`);
  }

  if (!isValidUrl(githubLink)) {
    redirect(`/team/${teamId}?error=github_url`);
  }

  if (deployedLink && !isValidUrl(deployedLink)) {
    redirect(`/team/${teamId}?error=deployed_url`);
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      githubLink,
      projectDescription,
      demoLink: deployedLink || null,
    },
  });

  revalidatePath(`/team/${teamId}`);
}

async function submitTeam(formData: FormData) {
  "use server";
  const user = await requireParticipant();

  const teamId = String(formData.get("teamId") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if (!team || team.leaderId !== user.id) {
    return;
  }

  const githubLink = String(team.githubLink ?? "").trim();
  const projectDescription = String(team.projectDescription ?? "").trim();
  const deployedLink = String(team.demoLink ?? "").trim();

  const isValid = Boolean(githubLink) && Boolean(projectDescription) && isValidUrl(githubLink) && (!deployedLink || isValidUrl(deployedLink));

  if (!isValid || confirm !== "on") {
    redirect(`/team/${teamId}?error=submission_requirements`);
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      status: TeamStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  revalidatePath(`/team/${teamId}`);
}

export default async function TeamDashboardPage({ params, searchParams }: PageProps) {
  const user = await requireParticipant();
  const { teamId } = await params;
  const qp = await searchParams;

  const teamMember = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id, status: TeamMemberStatus.APPROVED },
  });

  if (!teamMember) {
    redirect("/team-setup");
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      leader: true,
      members: {
        include: { user: { include: { participant: true } } },
        orderBy: { requestedAt: "asc" },
      },
      track: true,
    },
  });

  if (!team) {
    redirect("/team-setup");
  }

  const members = team.members as TeamMemberWithUser[];
  const approvedMembers = members.filter((m) => m.status === TeamMemberStatus.APPROVED);
  const pendingMembers = members.filter((m) => m.status === TeamMemberStatus.PENDING);
  const isLeader = team.leaderId === user.id;
  const statusText = STATUS_LABEL[team.status] ?? team.status;
  const statusClass = STATUS_BADGE[team.status] ?? "bg-slate-100 text-slate-800 border-slate-300";
  const isSubmitted = team.status !== TeamStatus.DRAFT;

  const canSubmit = Boolean(team.githubLink?.trim()) && Boolean(team.projectDescription?.trim());

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/register?invite=${team.code}`;

  return (
    <ParticipantShell>
      <section className="space-y-6">
        <div className="card p-6">
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="mt-2 text-sm">Status: <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusText}</span></p>
          {String(qp.error ?? "") && (
            <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {String(qp.error) === "submission_requirements" && "GitHub URL and Project Description are required before submission."}
              {String(qp.error) === "project_required" && "GitHub URL and Project Description are required."}
              {String(qp.error) === "github_url" && "Please enter a valid GitHub Repository URL (http/https)."}
              {String(qp.error) === "deployed_url" && "Please enter a valid Deployed Project URL (http/https)."}
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="mt-2 text-sm">Team Code: <span className="pill">{team.code}</span></p>
          <p className="mt-1 text-sm text-muted">Invite Link: <a className="text-accent" href={inviteLink}>{inviteLink}</a></p>
          <ul className="mt-3 grid gap-2">
            {approvedMembers.map((member) => (
              <li key={member.id} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
                {member.user.fullName} ({member.user.participant?.registerNumber ?? "N/A"}) {member.userId === team.leaderId ? "- Leader" : ""}
                {isLeader && member.userId !== team.leaderId && !isSubmitted && (
                  <form action={removeMember} className="mt-2">
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <button className="rounded-lg border border-border px-2 py-1 text-xs">Remove</button>
                  </form>
                )}
              </li>
            ))}
          </ul>

          {isLeader && pendingMembers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Pending Requests</h3>
              <div className="mt-2 grid gap-2">
                {pendingMembers.map((pending) => (
                  <div key={pending.id} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
                    {pending.user.fullName}
                    <form action={decideJoinRequest} className="mt-2 flex gap-2">
                      <input type="hidden" name="teamId" value={team.id} />
                      <input type="hidden" name="memberId" value={pending.id} />
                      <button name="decision" value="approve" className="rounded-lg bg-accent px-2 py-1 text-xs text-white">Approve</button>
                      <button name="decision" value="reject" className="rounded-lg border border-border px-2 py-1 text-xs">Reject</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <section className="card p-6">
          <h2 className="text-lg font-semibold">Project Submission</h2>
          <p className="mt-2 text-sm text-muted">Used for pre-shortlisting evaluation and team collaboration review.</p>

          {isLeader ? (
            <form action={updateTeamProject} className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="teamId" value={team.id} />
              <div className="md:col-span-2">
                <label htmlFor="githubLink" className="mb-1 block text-sm font-medium">GitHub Repository URL *</label>
                <input
                  id="githubLink"
                  name="githubLink"
                  defaultValue={team.githubLink ?? ""}
                  placeholder="https://github.com/your-org/your-repo"
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="projectDescription" className="mb-1 block text-sm font-medium">Project Description *</label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  defaultValue={team.projectDescription ?? ""}
                  placeholder="Describe your solution, architecture, and collaborative contributions."
                  rows={5}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="deployedLink" className="mb-1 block text-sm font-medium">Deployed Project Link (Optional)</label>
                <input
                  id="deployedLink"
                  name="deployedLink"
                  defaultValue={team.demoLink ?? ""}
                  placeholder="https://your-project-demo.vercel.app"
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
                />
              </div>
              <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white md:col-span-2">Update Project Details</button>
            </form>
          ) : (
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="font-semibold">GitHub Repository URL</p>
                <p className="mt-1 break-all">
                  {team.githubLink ? <a href={team.githubLink} className="text-accent" target="_blank" rel="noreferrer">{team.githubLink}</a> : "Not provided"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="font-semibold">Project Description</p>
                <p className="mt-1 whitespace-pre-wrap text-muted">{team.projectDescription?.trim() || "Not provided"}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="font-semibold">Deployed Project Link</p>
                <p className="mt-1 break-all">
                  {team.demoLink ? <a href={team.demoLink} className="text-accent" target="_blank" rel="noreferrer">{team.demoLink}</a> : "Not provided"}
                </p>
              </div>
            </div>
          )}
        </section>

        {!isSubmitted && isLeader && (
          <form action={submitTeam} className="card p-6">
            <input type="hidden" name="teamId" value={team.id} />
            <h2 className="text-lg font-semibold">Final Submission</h2>
            <p className="mt-2 text-sm text-muted">This submits the current team project details for shortlisting review.</p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirm" />
              I confirm all team project details are ready for review.
            </label>
            <button disabled={!canSubmit} className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Submit Team Registration</button>
          </form>
        )}

        {isSubmitted && (
          <section className="card p-6">
            <h2 className="text-lg font-semibold">Submission Locked</h2>
            <p className="mt-1 text-sm text-muted">Your team registration has been submitted successfully. Check-in tokens and QR flow are disabled for now.</p>
          </section>
        )}
      </section>
    </ParticipantShell>
  );
}
