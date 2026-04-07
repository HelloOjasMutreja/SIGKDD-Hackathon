import Link from "next/link";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TeamMemberStatus, TeamStatus } from "@/lib/domain";
import { ParticipantShell } from "@/components/participant-shell";
import { prisma } from "@/lib/prisma";
import { requireParticipant } from "@/lib/guards";
import { makeToken } from "@/lib/security";

type PageProps = {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

async function updateTeamDetails(formData: FormData) {
  "use server";
  const user = await requireParticipant();

  const teamId = String(formData.get("teamId") ?? "");
  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if (!team) {
    return;
  }

  const isMember = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id, status: TeamMemberStatus.APPROVED },
  });

  if (!isMember || team.status === TeamStatus.SUBMITTED) {
    return;
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      trackId: String(formData.get("trackId") ?? "") || null,
      projectName: String(formData.get("projectName") ?? "").trim() || null,
      projectDescription: String(formData.get("projectDescription") ?? "").trim() || null,
      techStack: String(formData.get("techStack") ?? "").trim() || null,
      githubLink: String(formData.get("githubLink") ?? "").trim() || null,
      demoLink: String(formData.get("demoLink") ?? "").trim() || null,
    },
  });

  revalidatePath(`/team/${teamId}`);
}

async function submitTeam(formData: FormData) {
  "use server";
  const user = await requireParticipant();

  const teamId = String(formData.get("teamId") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { where: { status: TeamMemberStatus.APPROVED } },
    },
  });

  if (!team || team.leaderId !== user.id || team.status === TeamStatus.SUBMITTED) {
    return;
  }

  const isValid =
    team.members.length >= 2 &&
    Boolean(team.trackId) &&
    Boolean(team.projectName?.trim()) &&
    Boolean(team.projectDescription?.trim());

  if (!isValid || confirm !== "on") {
    redirect(`/team/${teamId}?error=submission_requirements`);
  }

  const token = makeToken(18);
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify/${token}`;
  const qrCodeUrl = await QRCode.toDataURL(verifyUrl);

  await prisma.team.update({
    where: { id: teamId },
    data: {
      status: TeamStatus.SUBMITTED,
      submittedAt: new Date(),
      qrToken: token,
      qrCodeUrl,
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

  const tracks = await prisma.track.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });

  const approvedMembers = team.members.filter((m: any) => m.status === TeamMemberStatus.APPROVED);
  const pendingMembers = team.members.filter((m: any) => m.status === TeamMemberStatus.PENDING);
  const isLeader = team.leaderId === user.id;
  const isSubmitted = team.status === TeamStatus.SUBMITTED;

  const canSubmit =
    approvedMembers.length >= 2 &&
    Boolean(team.trackId) &&
    Boolean(team.projectName?.trim()) &&
    Boolean(team.projectDescription?.trim());

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/register?invite=${team.code}`;

  return (
    <ParticipantShell>
      <section className="space-y-6">
        <div className="card p-6">
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="mt-2 text-sm">Status: <span className="pill">{team.status}</span></p>
          {String(qp.error ?? "") && (
            <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Complete all required fields and confirmation before submission.</p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="mt-2 text-sm">Team Code: <span className="pill">{team.code}</span></p>
          <p className="mt-1 text-sm text-muted">Invite Link: <a className="text-accent" href={inviteLink}>{inviteLink}</a></p>
          <ul className="mt-3 grid gap-2">
            {approvedMembers.map((member: any) => (
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
                {pendingMembers.map((pending: any) => (
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

        <form action={updateTeamDetails} className="card grid gap-3 p-6 md:grid-cols-2">
          <input type="hidden" name="teamId" value={team.id} />
          <label className="text-sm md:col-span-2">Track Selection</label>
          <select
            name="trackId"
            defaultValue={team.trackId ?? ""}
            disabled={isSubmitted}
            className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2"
          >
            <option value="">Select track</option>
            {tracks.map((track: any) => (
              <option key={track.id} value={track.id}>{track.name}</option>
            ))}
          </select>
          <input name="projectName" defaultValue={team.projectName ?? ""} disabled={isSubmitted} placeholder="Project Name" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="projectDescription" defaultValue={team.projectDescription ?? ""} disabled={isSubmitted} placeholder="Project Description" rows={4} className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
          <input name="techStack" defaultValue={team.techStack ?? ""} disabled={isSubmitted} placeholder="Tech Stack (comma separated)" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
          <input name="githubLink" defaultValue={team.githubLink ?? ""} disabled={isSubmitted} placeholder="GitHub / Project Link" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          <input name="demoLink" defaultValue={team.demoLink ?? ""} disabled={isSubmitted} placeholder="Demo Link" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
          {!isSubmitted && <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white md:col-span-2">Save Draft</button>}
        </form>

        {!isSubmitted && isLeader && (
          <form action={submitTeam} className="card p-6">
            <input type="hidden" name="teamId" value={team.id} />
            <h2 className="text-lg font-semibold">Final Submission</h2>
            <p className="mt-2 text-sm text-muted">Team can submit only after minimum 2 approved members, selected track, and complete project basics.</p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirm" />
              I confirm all details are correct and cannot be edited after submission.
            </label>
            <button disabled={!canSubmit} className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Submit Team Registration</button>
          </form>
        )}

        {isSubmitted && team.qrCodeUrl && (
          <section className="card p-6">
            <h2 className="text-lg font-semibold">Check-in QR</h2>
            <p className="mt-1 text-sm text-muted">This QR is shared across all team members.</p>
            <img src={team.qrCodeUrl} alt="Team check-in QR" className="mt-4 h-56 w-56 rounded-xl border border-border bg-white p-2" />
            <a href={team.qrCodeUrl} download={`${team.name}-qr.png`} className="mt-3 inline-block rounded-lg border border-border px-3 py-1.5 text-sm">Download QR</a>
          </section>
        )}
      </section>
    </ParticipantShell>
  );
}
