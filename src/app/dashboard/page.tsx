import Link from "next/link";
import { redirect } from "next/navigation";
import { ParticipantShell } from "@/components/participant-shell";
import { getParticipantTeamState, requireParticipant } from "@/lib/guards";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Not Submitted",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  SHORTLISTED: "Shortlisted",
  REJECTED: "Rejected",
  APPROVED: "Approved",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "border-amber-300 bg-amber-50 text-amber-800",
  SUBMITTED: "border-blue-300 bg-blue-50 text-blue-800",
  UNDER_REVIEW: "border-indigo-300 bg-indigo-50 text-indigo-800",
  SHORTLISTED: "border-teal-300 bg-teal-50 text-teal-800",
  REJECTED: "border-red-300 bg-red-50 text-red-800",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export default async function ParticipantDashboardPage() {
  const user = await requireParticipant();
  const teamState = await getParticipantTeamState(user.id);

  if (teamState.state === "none") {
    redirect("/team-setup");
  }
  if (teamState.state === "pending") {
    redirect("/team-setup/pending");
  }

  const rawStatus = String(teamState.team?.status ?? "DRAFT");
  const statusLabel = STATUS_LABEL[rawStatus] ?? rawStatus;
  const statusClass = STATUS_STYLE[rawStatus] ?? "border-slate-300 bg-slate-50 text-slate-800";

  return (
    <ParticipantShell>
      <section className="card p-6">
        <h1 className="text-2xl font-bold">Participant Dashboard</h1>
        <p className="mt-2 text-sm text-muted">Welcome back, {user.fullName}.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
            <p className="font-semibold">Team Status</p>
            <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusClass}`}>{statusLabel}</p>
            <p className="mt-2 text-muted">This status represents your team submission stage for shortlisting review.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
            <p className="font-semibold">Next Step</p>
            <Link href={`/team/${teamState.teamId}`} className="mt-1 inline-block text-accent">Open Team Dashboard</Link>
          </div>
        </div>
      </section>
    </ParticipantShell>
  );
}
