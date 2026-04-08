import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TeamMemberStatus, TeamStatus } from "@/lib/domain";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ParticipantShell } from "@/components/participant-shell";
import { getParticipantTeamState } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { requireParticipant } from "@/lib/guards";
import { SectionAlert } from "@/components/section-alert";
import { buildAlertUrl } from "@/lib/alerts";

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

const MIN_TEAM_SIZE = 3;
const MAX_TEAM_SIZE = 4;

const ERROR_MESSAGES: Record<string, string> = {
  project_required: "Project submission incomplete.",
  github_required: "Project submission incomplete.",
  description_required: "Project submission incomplete.",
  github_url: "Enter a valid GitHub repository URL.",
  deployed_url: "Enter a valid deployed project URL.",
  team_too_small: "Team confirmation is blocked until at least 3 members have approved the team.",
  team_too_large: "Team confirmation is blocked because the team cannot exceed 4 approved members.",
  team_pending_members: "Team confirmation is blocked until every member has joined the team.",
  confirm_required: "You must confirm details before submission.",
  already_submitted: "This team has already been confirmed and is locked.",
  team_locked: "Details locked after team confirmation.",
};

const MEMBER_ERROR_MESSAGES: Record<string, string> = {
  team_locked: "Details locked after team confirmation.",
  member_not_found: "The selected member could not be found.",
};

const PROJECT_ERROR_MESSAGES: Record<string, string> = {
  team_locked: "Details locked after team confirmation.",
  github_url: "Enter a valid GitHub repository URL.",
  deployed_url: "Enter a valid deployed project URL.",
};

function getSectionAlertCode(code: string, messages: Record<string, string>) {
  const message = messages[code];
  return message ? { code, message } : null;
}

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

  if (team.status !== TeamStatus.DRAFT) {
    redirect(`/team/${teamId}?memberError=team_locked`);
  }

  await prisma.teamMember.update({
    where: { id: memberId },
    data: {
      status: decision === "approve" ? TeamMemberStatus.APPROVED : TeamMemberStatus.REJECTED,
      respondedAt: new Date(),
    },
  });

  revalidatePath(`/team/${teamId}`);
  if (decision === "approve") {
    redirect(buildAlertUrl(`/team/${teamId}`, {
      variant: "success",
      title: "Member added successfully.",
      message: "The request was approved and the member can now access the team dashboard.",
    }));
  }

  redirect(`/team/${teamId}`);
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

  if (team.status !== TeamStatus.DRAFT) {
    redirect(`/team/${teamId}?memberError=team_locked`);
  }

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!member || member.userId === user.id) {
    return;
  }

  await prisma.teamMember.delete({ where: { id: memberId } });
  revalidatePath(`/team/${teamId}`);
  redirect(buildAlertUrl(`/team/${teamId}`, {
    variant: "info",
    title: "Member removed.",
    message: "The member was removed from the team roster.",
  }));
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

  if (team.status !== TeamStatus.DRAFT) {
    redirect(`/team/${teamId}?projectError=team_locked`);
  }

  const githubLink = String(formData.get("githubLink") ?? "").trim();
  const projectDescription = String(formData.get("projectDescription") ?? "").trim();
  const deployedLink = String(formData.get("deployedLink") ?? "").trim();

  if (githubLink && !isValidUrl(githubLink)) {
    redirect(`/team/${teamId}?projectError=github_url`);
  }

  if (deployedLink && !isValidUrl(deployedLink)) {
    redirect(`/team/${teamId}?projectError=deployed_url`);
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      githubLink: githubLink || null,
      projectDescription: projectDescription || null,
      demoLink: deployedLink || null,
    },
  });

  revalidatePath(`/team/${teamId}`);
  redirect(`/team/${teamId}?projectSaved=1`);
}

async function submitTeam(formData: FormData) {
  "use server";
  const user = await requireParticipant();

  const teamId = String(formData.get("teamId") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        select: { status: true },
      },
    },
  });

  if (!team || team.leaderId !== user.id) {
    return;
  }

  if (team.status !== TeamStatus.DRAFT) {
    redirect(`/team/${teamId}?confirmationError=team_locked`);
  }

  if (!confirm || confirm !== "on") {
    redirect(`/team/${teamId}?confirmationError=confirm_required`);
  }

  const approvedMemberCount = team.members.filter((member: TeamMemberWithUser) => member.status === TeamMemberStatus.APPROVED).length;
  const hasPendingMembers = team.members.some((member: TeamMemberWithUser) => member.status === TeamMemberStatus.PENDING);

  const githubLink = String(team.githubLink ?? "").trim();
  const projectDescription = String(team.projectDescription ?? "").trim();
  const deployedLink = String(team.demoLink ?? "").trim();

  if (approvedMemberCount < MIN_TEAM_SIZE) {
    redirect(`/team/${teamId}?confirmationError=team_too_small&projectError=project_required`);
  }

  if (approvedMemberCount > MAX_TEAM_SIZE) {
    redirect(`/team/${teamId}?confirmationError=team_too_large`);
  }

  if (hasPendingMembers) {
    redirect(`/team/${teamId}?confirmationError=team_pending_members`);
  }

  if (!githubLink && !projectDescription) {
    redirect(`/team/${teamId}?projectError=project_required&confirmationError=project_required`);
  }

  if (!githubLink) {
    redirect(`/team/${teamId}?projectError=github_required&confirmationError=project_required`);
  }

  if (!projectDescription) {
    redirect(`/team/${teamId}?projectError=description_required&confirmationError=project_required`);
  }

  if (!isValidUrl(githubLink)) {
    redirect(`/team/${teamId}?projectError=github_url`);
  }

  if (deployedLink && !isValidUrl(deployedLink)) {
    redirect(`/team/${teamId}?projectError=deployed_url`);
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      status: TeamStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  revalidatePath(`/team/${teamId}`);
  redirect(buildAlertUrl(`/team/${teamId}`, {
    variant: "success",
    title: "Team registration completed.",
    message: "Your confirmed team has been submitted for review.",
  }));
}

export default async function TeamDashboardPage({ params, searchParams }: PageProps) {
  const user = await requireParticipant();
  const { teamId } = await params;
  const qp = await searchParams;
  const teamState = await getParticipantTeamState(user.id);

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
  const isDraft = team.status === TeamStatus.DRAFT;
  const isSubmitted = !isDraft;
  const approvedMemberCount = approvedMembers.length;
  const hasGithubLink = Boolean(team.githubLink?.trim());
  const hasProjectDescription = Boolean(team.projectDescription?.trim());
  const hasPendingMembers = pendingMembers.length > 0;
  const projectReady = hasGithubLink && hasProjectDescription;
  const projectStatusLabel = projectReady ? "Ready" : "Draft";
  const canSubmit = approvedMemberCount >= MIN_TEAM_SIZE && approvedMemberCount <= MAX_TEAM_SIZE && hasGithubLink && hasProjectDescription && !hasPendingMembers;

  const confirmationChecklist = [
    { label: "Approved members", value: `${approvedMemberCount}/${MIN_TEAM_SIZE}-${MAX_TEAM_SIZE}`, complete: approvedMemberCount >= MIN_TEAM_SIZE && approvedMemberCount <= MAX_TEAM_SIZE },
    { label: "GitHub link", value: hasGithubLink ? "Provided" : "Missing", complete: hasGithubLink },
    { label: "Description", value: hasProjectDescription ? "Provided" : "Missing", complete: hasProjectDescription },
    { label: "All members joined", value: hasPendingMembers ? "Pending" : "Complete", complete: !hasPendingMembers },
  ];


  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/register?invite=${team.code}`;

  const identity = {
    initials: user.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() ?? "")
      .join("") || "P",
    roleLabel: isLeader ? "Team Leader" : teamMember ? "Team Member" : teamState.state === "pending" ? "Join Pending" : "Participant",
    displayName: user.fullName,
  };

  const memberErrorCode = String(qp.memberError ?? "");
  const projectErrorCode = String(qp.projectError ?? "");
  const confirmationErrorCode = String(qp.confirmationError ?? "");
  const projectSaved = String(qp.projectSaved ?? "") === "1";
  const memberAlert = getSectionAlertCode(memberErrorCode, MEMBER_ERROR_MESSAGES);
  const projectAlert = getSectionAlertCode(projectErrorCode, PROJECT_ERROR_MESSAGES);
  const confirmationAlert = getSectionAlertCode(confirmationErrorCode, ERROR_MESSAGES);

  return (
    <ParticipantShell identity={identity}>
      <section className="space-y-6">
        <div className="card p-6">
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="mt-2 text-sm">Status: <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusText}</span></p>
          {!isDraft && <SectionAlert variant="warning" title="Details locked after team confirmation." message="Team, project, and submission edits are disabled once the team is confirmed." className="mt-3" />}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold">Members</h2>
          {memberAlert && (
            <SectionAlert
              variant={memberErrorCode === "team_locked" ? "warning" : "error"}
              title={memberErrorCode === "team_locked" ? "Details locked after team confirmation." : "Member update blocked."}
              message={memberAlert.message}
              className="mt-3"
            />
          )}
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

          {isDraft && isLeader && pendingMembers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Pending Requests</h3>
              <div className="mt-2 grid gap-2">
                {pendingMembers.map((pending) => (
                  <div key={pending.id} className="rounded-lg border border-border bg-surface-2 p-3 text-sm">
                    {pending.user.fullName}
                    <form action={decideJoinRequest} className="mt-2 flex gap-2">
                      <input type="hidden" name="teamId" value={team.id} />
                      <input type="hidden" name="memberId" value={pending.id} />
                      <FormSubmitButton name="decision" value="approve" pendingLabel="Approving..." className="rounded-lg bg-accent px-2 py-1 text-xs text-white">Approve</FormSubmitButton>
                      <FormSubmitButton name="decision" value="reject" pendingLabel="Rejecting..." className="rounded-lg border border-border px-2 py-1 text-xs">Reject</FormSubmitButton>
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
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="font-semibold">Project Submission:</span>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${projectReady ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
              Status: {projectStatusLabel}
            </span>
          </div>
          {projectSaved && <SectionAlert variant="success" title="Draft saved." message="Project draft saved." className="mt-3" />}
          {projectAlert && (
            <SectionAlert
              variant={projectErrorCode === "team_locked" ? "warning" : "error"}
              title={projectErrorCode === "team_locked" ? "Details locked after team confirmation." : "Project submission incomplete."}
              message={projectAlert.message}
              hint={projectErrorCode === "team_locked" ? "Project edits are disabled after confirmation." : "Update the project section, then try confirming again."}
              className="mt-3"
            />
          )}

          {isLeader ? (
            isDraft ? (
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
              <div className="md:col-span-2">
                <FormSubmitButton pendingLabel="Saving..." className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Save Draft</FormSubmitButton>
              </div>
            </form>
            ) : (
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="font-semibold">Project editing locked</p>
                <p className="mt-1 text-muted">Details locked after team confirmation.</p>
              </div>
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
            )
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

        <section className="card p-6">
          <h2 className="text-lg font-semibold">Team QR Access</h2>
          {team.status === TeamStatus.APPROVED && team.qrCodeUrl ? (
            <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
              <img src={team.qrCodeUrl} alt="Team QR code" className="w-full rounded-xl border border-border bg-white p-2" />
              <div className="text-sm text-muted">
                <p className="font-semibold text-foreground">QR is ready for event check-in and meal scans.</p>
                <p className="mt-2">This code is shared with all approved team members.</p>
                <p className="mt-2">QR token stored in the database and enabled only after selection.</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">QR will be available after selection.</p>
          )}
        </section>

        {!isSubmitted && isLeader && (
          <form action={submitTeam} className="card p-6">
            <input type="hidden" name="teamId" value={team.id} />
            <h2 className="text-lg font-semibold">Final Submission</h2>
            <p className="mt-2 text-sm text-muted">This confirms the current team package for review and locks it after submission.</p>
            {confirmationAlert && (
              <SectionAlert
                variant={confirmationErrorCode === "confirm_required" || confirmationErrorCode === "project_required" ? "error" : "warning"}
                title={confirmationErrorCode === "project_required" ? "Project submission incomplete." : "Confirmation required."}
                message={confirmationAlert.message}
                hint="Fix the issue in the indicated section before resubmitting."
                className="mt-3"
              />
            )}

            <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold">Confirmation checklist</p>
              <div className="mt-3 grid gap-2 text-sm">
                {confirmationChecklist.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted">{item.value}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${item.complete ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
                      {item.complete ? "Ready" : "Needs work"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirm" />
              I confirm all team project details are ready for review.
            </label>
            <p className="mt-3 text-sm text-muted">Confirmation requires 3-4 approved members, a GitHub repository link, a project description, and every member joined.</p>
            <FormSubmitButton disabled={!canSubmit} pendingLabel="Submitting..." className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Confirm Team Registration</FormSubmitButton>
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
