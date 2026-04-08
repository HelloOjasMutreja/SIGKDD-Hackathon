import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { OrganizerShell } from "@/components/organizer-shell";
import { FormSubmitButton } from "@/components/form-submit-button";
import { TeamMemberStatus, TeamStatus } from "@/lib/domain";
import { requireApprovedOrganizer } from "@/lib/guards";
import { canUseOrganizerCapability } from "@/lib/org-access";
import { prisma } from "@/lib/prisma";
import { buildTeamQrCodeUrl } from "@/lib/qr";
import { makeToken } from "@/lib/security";
import { formErrorClass, formFieldClass, formSelectClass, formTextareaClass, formSuccessClass, getFormErrorMessage, normalizeFormValue } from "@/lib/utils";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type TeamMemberWithUser = {
  id: string;
  status: TeamMemberStatus;
  userId: string;
  user: {
    fullName: string;
    email: string;
    participant?: {
      registerNumber?: string | null;
    } | null;
  };
};

const STATUS_OPTIONS: TeamStatus[] = [
  TeamStatus.DRAFT,
  TeamStatus.SUBMITTED,
  TeamStatus.UNDER_REVIEW,
  TeamStatus.APPROVED,
  TeamStatus.REJECTED,
];

const STATUS_LABEL: Record<TeamStatus, string> = {
  [TeamStatus.DRAFT]: "Draft",
  [TeamStatus.SUBMITTED]: "Submitted",
  [TeamStatus.UNDER_REVIEW]: "Under Review",
  [TeamStatus.APPROVED]: "Approved",
  [TeamStatus.REJECTED]: "Rejected",
};

const STATUS_STYLE: Record<TeamStatus, string> = {
  [TeamStatus.DRAFT]: "border-amber-300 bg-amber-50 text-amber-800",
  [TeamStatus.SUBMITTED]: "border-blue-300 bg-blue-50 text-blue-800",
  [TeamStatus.UNDER_REVIEW]: "border-indigo-300 bg-indigo-50 text-indigo-800",
  [TeamStatus.APPROVED]: "border-emerald-300 bg-emerald-50 text-emerald-800",
  [TeamStatus.REJECTED]: "border-red-300 bg-red-50 text-red-800",
};

async function saveReview(formData: FormData) {
  "use server";
  const actor = await requireApprovedOrganizer();
  if (!canUseOrganizerCapability(actor.role, actor.organizerProfile?.approvedRole ?? null, "teams:review")) {
    return;
  }

  const teamId = normalizeFormValue(formData.get("teamId"));
  const decision = normalizeFormValue(formData.get("decision")) as TeamStatus;
  const scoreRaw = normalizeFormValue(formData.get("reviewScore"));
  const reviewNotes = normalizeFormValue(formData.get("reviewNotes"));

  if (!teamId) {
    redirect("/organizer/review?error=missing_team_id");
  }

  if (!decision || !STATUS_OPTIONS.includes(decision)) {
    redirect(`/organizer/review?teamId=${teamId}&error=missing_decision`);
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    redirect("/organizer/review?error=team_not_found");
  }

  const reviewScore = scoreRaw ? Number(scoreRaw) : null;
  if (scoreRaw && Number.isNaN(reviewScore)) {
    redirect(`/organizer/review?teamId=${teamId}&error=invalid_score`);
  }

  const updateData: Record<string, unknown> = {
    status: decision,
    reviewScore,
    reviewNotes: reviewNotes || null,
    reviewedBy: actor.id,
    reviewedAt: new Date(),
  };

  if (decision === TeamStatus.APPROVED) {
    const qrToken = team.qrToken ?? makeToken(24);
    updateData.qrToken = qrToken;
    updateData.qrCodeUrl = await buildTeamQrCodeUrl({
      id: team.id,
      name: team.name,
      status: TeamStatus.APPROVED,
      qrToken,
    });
    updateData.qrGeneratedAt = new Date();
  }

  if (decision === TeamStatus.REJECTED) {
    updateData.qrToken = null;
    updateData.qrCodeUrl = null;
    updateData.qrGeneratedAt = null;
  }

  await prisma.team.update({
    where: { id: teamId },
    data: updateData,
  });

  revalidatePath("/organizer/review");
  revalidatePath("/organizer/teams");
  revalidatePath(`/team/${teamId}`);
}

async function queueNotification(formData: FormData) {
  "use server";
  const actor = await requireApprovedOrganizer();
  if (!canUseOrganizerCapability(actor.role, actor.organizerProfile?.approvedRole ?? null, "teams:approve")) {
    return;
  }

  const teamId = normalizeFormValue(formData.get("teamId"));
  if (!teamId) {
    redirect("/organizer/review?error=missing_team_id");
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    redirect("/organizer/review?error=team_not_found");
  }

  if (team.status !== TeamStatus.APPROVED) {
    redirect(`/organizer/review?teamId=${teamId}&error=not_approved`);
  }

  await prisma.team.update({
    where: { id: teamId },
    data: { notificationQueuedAt: new Date() },
  });

  revalidatePath("/organizer/review");
  revalidatePath(`/team/${teamId}`);
}

export default async function OrganizerReviewPage({ searchParams }: SearchProps) {
  const user = await requireApprovedOrganizer();
  if (!canUseOrganizerCapability(user.role, user.organizerProfile?.approvedRole ?? null, "teams:view")) {
    return (
      <OrganizerShell>
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Team Review</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Access restricted to review-capable organizers.</p>
        </section>
      </OrganizerShell>
    );
  }

  const params = await searchParams;
  const trackId = String(params.trackId ?? "");
  const status = String(params.status ?? "");
  const selectedTeamId = String(params.teamId ?? "");
  const error = String(params.error ?? "");

  const tracks = await prisma.track.findMany({ orderBy: { createdAt: "desc" } });

  const teams = await prisma.team.findMany({
    where: {
      trackId: trackId || undefined,
      status: status ? (status as TeamStatus) : undefined,
    },
    include: {
      leader: true,
      track: true,
      members: { include: { user: { include: { participant: true } } }, orderBy: { requestedAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const selectedTeam = selectedTeamId
    ? await prisma.team.findUnique({
        where: { id: selectedTeamId },
        include: {
          leader: true,
          track: true,
          members: { include: { user: { include: { participant: true } } }, orderBy: { requestedAt: "asc" } },
        },
      })
    : teams[0] ?? null;

  const members = (selectedTeam?.members ?? []) as TeamMemberWithUser[];
  const approvedMembers = members.filter((member) => member.status === TeamMemberStatus.APPROVED);
  const pendingMembers = members.filter((member) => member.status === TeamMemberStatus.PENDING);
  const reviewReady = Boolean(selectedTeam?.githubLink?.trim() && selectedTeam?.projectDescription?.trim());
  const reviewErrorMessage = getFormErrorMessage(error, {
    missing_team_id: "Select a team first.",
    missing_decision: "Choose a review decision.",
    invalid_score: "Please enter a valid numeric score.",
    team_not_found: "Team not found.",
    not_approved: "Only approved teams can queue email notifications.",
  });

  return (
    <OrganizerShell>
      <section className="space-y-6">
        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Team Review</h1>
          <p className="mt-2 text-sm text-[#4f647b]">Submission viewer, internal scoring, review decision, and QR issuance.</p>
          {error && <p className={formErrorClass}>{reviewErrorMessage}</p>}
        </div>

        <div className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <form className="flex flex-wrap gap-3" method="get">
            <select name="trackId" defaultValue={trackId} className={formSelectClass}>
              <option value="">All tracks</option>
              {tracks.map((track: { id: string; name: string }) => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
            <select name="status" defaultValue={status} className={formSelectClass}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{STATUS_LABEL[option]}</option>
              ))}
            </select>
            <button className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white">Apply</button>
          </form>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-x-auto rounded-2xl border border-[#cdd8e5] bg-white p-4">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#dde6f0]">
                  <th className="py-2">Team</th>
                  <th className="py-2">Track</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">QR</th>
                  <th className="py-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team: { id: string; name: string; leader: { fullName: string }; track?: { name: string } | null; status: TeamStatus; qrToken?: string | null }) => {
                  const isSelected = team.id === selectedTeam?.id;
                  return (
                    <tr key={team.id} className={`border-b border-[#eef3f8] ${isSelected ? "bg-emerald-50/50" : ""}`}>
                      <td className="py-2">
                        <div className="font-semibold text-[#17324d]">{team.name}</div>
                        <div className="text-xs text-[#4f647b]">{team.leader.fullName}</div>
                      </td>
                      <td className="py-2">{team.track?.name ?? "-"}</td>
                      <td className="py-2">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[team.status as TeamStatus] ?? STATUS_STYLE[TeamStatus.DRAFT]}`}>
                          {STATUS_LABEL[team.status as TeamStatus] ?? team.status}
                        </span>
                      </td>
                      <td className="py-2">{team.qrToken ? "Ready" : "Pending"}</td>
                      <td className="py-2"><Link href={`/organizer/review?teamId=${team.id}${trackId ? `&trackId=${trackId}` : ""}${status ? `&status=${status}` : ""}`} className="text-[#17324d] underline">View</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-6">
            {selectedTeam ? (
              <>
                <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-[#17324d]">{selectedTeam.name}</h2>
                      <p className="mt-1 text-sm text-[#4f647b]">{selectedTeam.track?.name ?? "No track assigned"}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[selectedTeam.status as TeamStatus] ?? STATUS_STYLE[TeamStatus.DRAFT]}`}>
                      {STATUS_LABEL[selectedTeam.status as TeamStatus] ?? selectedTeam.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-[#17324d]">
                    <p><span className="font-semibold">Leader:</span> {selectedTeam.leader.fullName}</p>
                    <p><span className="font-semibold">Members:</span> {approvedMembers.length} approved, {pendingMembers.length} pending</p>
                    <p><span className="font-semibold">GitHub:</span> {selectedTeam.githubLink ? <a href={selectedTeam.githubLink} target="_blank" rel="noreferrer" className="text-[#17324d] underline">{selectedTeam.githubLink}</a> : "Missing"}</p>
                    <p><span className="font-semibold">Deployed link:</span> {selectedTeam.demoLink ? <a href={selectedTeam.demoLink} target="_blank" rel="noreferrer" className="text-[#17324d] underline">{selectedTeam.demoLink}</a> : "Optional"}</p>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
                  <h3 className="text-lg font-semibold text-[#17324d]">Submission Viewer</h3>
                  <div className="mt-3 grid gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-[#17324d]">Project Description</p>
                      <p className="mt-1 whitespace-pre-wrap text-[#4f647b]">{selectedTeam.projectDescription?.trim() || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#17324d]">Internal Score</p>
                      <p className="mt-1 text-[#4f647b]">{selectedTeam.reviewScore ?? "Not scored"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#17324d]">Reviewer Notes</p>
                      <p className="mt-1 whitespace-pre-wrap text-[#4f647b]">{selectedTeam.reviewNotes?.trim() || "No internal notes yet"}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
                  <h3 className="text-lg font-semibold text-[#17324d]">Review Action</h3>
                  <p className="mt-1 text-sm text-[#4f647b]">Internal-only score and notes. Participants cannot see these fields.</p>
                  <form action={saveReview} className="mt-4 grid gap-3">
                    <input type="hidden" name="teamId" value={selectedTeam.id} />
                    <label className="grid gap-1 text-sm font-medium text-[#17324d]">
                      <span>Decision *</span>
                      <select name="decision" defaultValue={selectedTeam.status} className={formSelectClass}>
                        <option value="">Select decision</option>
                        <option value={TeamStatus.UNDER_REVIEW}>Under Review</option>
                        <option value={TeamStatus.APPROVED}>Approve</option>
                        <option value={TeamStatus.REJECTED}>Reject</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-[#17324d]">
                      <span>Internal Score</span>
                      <input name="reviewScore" type="number" min="0" max="100" defaultValue={selectedTeam.reviewScore ?? ""} placeholder="0-100" className={formFieldClass} />
                    </label>
                    <label className="grid gap-1 text-sm font-medium text-[#17324d]">
                      <span>Reviewer Notes</span>
                      <textarea name="reviewNotes" rows={5} defaultValue={selectedTeam.reviewNotes ?? ""} placeholder="Internal notes only" className={formTextareaClass} />
                    </label>
                    <FormSubmitButton pendingLabel="Saving..." className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white">Save Review</FormSubmitButton>
                  </form>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={queueNotification}>
                      <input type="hidden" name="teamId" value={selectedTeam.id} />
                      <FormSubmitButton disabled={selectedTeam.status !== TeamStatus.APPROVED} pendingLabel="Queueing..." className="rounded-xl border border-[#cdd8e5] px-4 py-2 text-sm font-semibold">Queue Email Notification</FormSubmitButton>
                    </form>
                    <span className="text-sm text-[#4f647b]">{selectedTeam.notificationQueuedAt ? `Queued at ${new Date(selectedTeam.notificationQueuedAt).toLocaleString()}` : "No notification queued yet"}</span>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
                  <h3 className="text-lg font-semibold text-[#17324d]">QR Management</h3>
                  {selectedTeam.status === TeamStatus.APPROVED && selectedTeam.qrCodeUrl ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
                      <img src={selectedTeam.qrCodeUrl} alt="Team QR code" className="w-full rounded-xl border border-[#cdd8e5] bg-white p-2" />
                      <div className="text-sm text-[#4f647b]">
                        <p><span className="font-semibold text-[#17324d]">QR status:</span> Ready</p>
                        <p className="mt-2"><span className="font-semibold text-[#17324d]">Token:</span> Stored in database and used for check-in and meal scans.</p>
                        <p className="mt-2"><span className="font-semibold text-[#17324d]">Generated:</span> {selectedTeam.qrGeneratedAt ? new Date(selectedTeam.qrGeneratedAt).toLocaleString() : "Not recorded"}</p>
                        <p className="mt-2"><span className="font-semibold text-[#17324d]">Delivery:</span> The QR stays visible to all approved team members on their dashboard.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">QR generation happens after approval.</p>
                  )}
                </section>
              </>
            ) : (
              <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
                <h2 className="text-lg font-semibold text-[#17324d]">No team selected</h2>
                <p className="mt-2 text-sm text-[#4f647b]">Use the list on the left to open a team submission.</p>
              </section>
            )}
          </div>
        </div>
      </section>
    </OrganizerShell>
  );
}
