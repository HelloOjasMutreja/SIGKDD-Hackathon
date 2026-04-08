import Link from "next/link";
import { ParticipantShell } from "@/components/participant-shell";
import { TeamMemberStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
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

const timelineStages = [
  {
    step: "01",
    title: "Registration Phase",
    summary: "Teams register, assemble, and prepare for submission.",
    points: [
      "Registration open until 14 August 2026, 11:59 PM.",
      "Teams must contain 3-4 participants.",
      "All members must join the team before submission.",
    ],
  },
  {
    step: "02",
    title: "Project Submission Requirement",
    summary: "Every team submits one project for evaluation.",
    points: [
      "Submit ONE project to demonstrate capability.",
      "The project may belong to one member or multiple members.",
      "No technology restrictions and no domain restrictions.",
      "The project is used only for evaluation.",
      "Required items: GitHub repository link and project description.",
      "Optional item: deployed link.",
    ],
  },
  {
    step: "03",
    title: "Team Confirmation",
    summary: "The leader confirms a complete, ready-to-review team.",
    points: [
      "Confirmation is allowed only after team size is valid.",
      "Project details must already be submitted.",
      "The confirmation checkbox must be checked.",
      "Leader action only.",
      "Once confirmed, the team becomes locked.",
    ],
  },
  {
    step: "04",
    title: "Review Phase",
    summary: "Organizers review the submitted project package.",
    points: [
      "Organizer review begins after confirmation.",
      "Teams are evaluated based on the submitted project.",
      "No further action is required from participants.",
    ],
  },
  {
    step: "05",
    title: "Selection Notification",
    summary: "Shortlisted teams receive the next instructions by email.",
    points: [
      "Selected teams are notified via email.",
      "Communication happens only through the registered email address.",
    ],
  },
];

const teamRequirements = [
  "3-4 participants per team.",
  "All members must join before submission.",
  "The leader handles confirmation.",
];

const projectRequirements = [
  "Submit one project only.",
  "The project can belong to one member or multiple members.",
  "No technology restrictions.",
  "No domain restrictions.",
  "Used only for evaluation.",
  "Required: GitHub repository link and project description.",
  "Optional: deployed link.",
];

const importantRules = [
  "Team becomes locked immediately after confirmation.",
  "No edits are allowed after confirmation.",
  "No member changes are allowed after confirmation.",
  "No project edits are allowed after confirmation.",
  "The leader is responsible for the final confirmation step.",
];

const nextSteps = [
  {
    title: "Review Phase",
    points: [
      "Organizer review starts after team confirmation.",
      "Evaluation is based on the submitted project.",
      "Participants do not need to take any further action.",
    ],
  },
  {
    title: "Selection Notification",
    points: [
      "Shortlisted teams are contacted by email.",
      "All communication uses the registered email address.",
    ],
  },
  {
    title: "Offline Hackathon",
    points: [
      "For selected teams only.",
      "Event dates: 17-18 April.",
      "Duration: 2 days.",
      "Daily schedule will be shared later with shortlisted teams.",
    ],
  },
];

export default async function ParticipantDashboardPage() {
  const user = await requireParticipant();
  const teamState = await getParticipantTeamState(user.id);

  const rawStatus = String(teamState.team?.status ?? "DRAFT");
  const statusLabel = STATUS_LABEL[rawStatus] ?? rawStatus;
  const statusClass = STATUS_STYLE[rawStatus] ?? "border-slate-300 bg-slate-50 text-slate-800";
  const team = teamState.teamId
    ? await prisma.team.findUnique({
        where: { id: teamState.teamId },
        include: {
          members: {
            select: { status: true },
          },
        },
      })
    : null;
  const approvedMemberCount = team?.members.filter((member: { status: TeamMemberStatus }) => member.status === TeamMemberStatus.APPROVED).length ?? 0;
  const pendingMemberCount = team?.members.filter((member: { status: TeamMemberStatus }) => member.status === TeamMemberStatus.PENDING).length ?? 0;
  const teamSizeBadge = team
    ? `${approvedMemberCount} confirmed${pendingMemberCount > 0 ? `, ${pendingMemberCount} pending` : ""}`
    : "No team yet";
  const teamLink = teamState.teamId ? `/team/${teamState.teamId}` : "/team-setup";
  const teamLinkLabel = teamState.state === "none" ? "Create or join a team" : "Open team dashboard";

  return (
    <ParticipantShell>
      <section className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-800">Registration Open</span>
              <span className="rounded-full border border-border px-3 py-1">Participant Command Center</span>
            </div>
            <h1 className="mt-4 text-3xl font-bold">Hackathon Participant Homepage</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted">Use this page to understand the process, check the deadlines, and confirm what your team must complete before submission.</p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Deadline</p>
                <p className="mt-2 text-lg font-semibold text-emerald-950">14 August 2026</p>
                <p className="text-sm text-emerald-800">11:59 PM</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Team Size</p>
                <p className="mt-2 text-lg font-semibold">3-4 participants</p>
                <p className="text-sm text-muted">All members must join before submission.</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Team Status</p>
                <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusClass}`}>{statusLabel}</p>
                <p className="mt-2 text-sm text-muted">{teamSizeBadge}</p>
              </div>
            </div>
          </div>

          <aside className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Quick Actions</p>
            <div className="mt-4 grid gap-3 text-sm">
              <Link href={teamLink} className="rounded-xl border border-border bg-surface-2 px-4 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                {teamLinkLabel}
              </Link>
              <Link href="/profile" className="rounded-xl border border-border bg-surface-2 px-4 py-3 font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                Review your profile
              </Link>
              <div className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="font-semibold">Current participant</p>
                <p className="mt-1 text-sm text-muted">{user.fullName}</p>
              </div>
            </div>
          </aside>
        </div>

        <section className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Hackathon Timeline</p>
              <h2 className="mt-2 text-2xl font-bold">Step-by-step process overview</h2>
            </div>
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">Registration → Submission → Confirmation → Review → Selection</span>
          </div>

          <ol className="mt-6 grid gap-4">
            {timelineStages.map((stage) => (
              <li key={stage.step} className="rounded-2xl border border-border bg-surface-2 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-sm font-bold text-accent">{stage.step}</div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold">{stage.title}</h3>
                    <p className="mt-1 text-sm text-muted">{stage.summary}</p>
                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-foreground">
                      {stage.points.map((point) => (
                        <li key={point} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Requirements</p>
            <h2 className="mt-2 text-xl font-bold">Team requirements</h2>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-foreground">
              {teamRequirements.map((requirement) => (
                <li key={requirement} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Requirements</p>
            <h2 className="mt-2 text-xl font-bold">Project requirements</h2>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-foreground">
              {projectRequirements.map((requirement) => (
                <li key={requirement} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Important Rules</p>
          <h2 className="mt-2 text-xl font-bold">Locking and leader responsibility</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <p className="font-semibold text-amber-950">Team locking after confirmation</p>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-900">
                {importantRules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-600" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm leading-6 text-muted">
              <p className="font-semibold text-foreground">Confirmation gate</p>
              <p className="mt-2">The leader must verify the submission, check the confirmation box, and submit the team only after the team-size requirement and project requirement are complete.</p>
              <div className="mt-4 rounded-xl border border-border bg-background px-3 py-2 text-foreground">
                Locked means no member changes, no project edits, and no rollback after confirmation.
              </div>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Next Steps</p>
          <h2 className="mt-2 text-xl font-bold">What happens after submission</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {nextSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-border bg-surface-2 p-4">
                <h3 className="text-base font-semibold">{step.title}</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-foreground">
                  {step.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </section>
    </ParticipantShell>
  );
}
