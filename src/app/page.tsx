import Link from "next/link";

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

export default function ParticipantPortalHome() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-[#fff7ea] p-8 shadow-[0_20px_50px_rgba(20,90,82,0.12)] md:p-12">
          <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-accent/15 blur-2xl" />
          <div className="absolute -bottom-20 -left-14 h-56 w-56 rounded-full bg-accent-2/20 blur-2xl" />

          <p className="pill inline-block">SIGKDD Student Chapter Presents</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-tight tracking-tight md:text-6xl">
            SIGKDD
            <span className="block text-accent">Hackathon 2026</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">
            Build with your best team, compete across tracks, and pitch your idea. Registration is now live with guided onboarding.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">Start Registration</Link>
            <Link href="/login" className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold">Participant Login</Link>
          </div>

          <div className="mt-8 grid max-w-3xl gap-3 text-sm md:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-white/80 px-4 py-3">
              <p className="font-semibold">1. Register</p>
              <p className="mt-1 text-muted">Complete the multi-step participant form.</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-white/80 px-4 py-3">
              <p className="font-semibold">2. Team Up</p>
              <p className="mt-1 text-muted">Create a team, or join using code or invite link.</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-white/80 px-4 py-3">
              <p className="font-semibold">3. Submit</p>
              <p className="mt-1 text-muted">Finalize project basics and lock your submission.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="card p-6">
            <h2 className="text-xl font-bold">Registration Window</h2>
            <p className="mt-2 text-sm text-muted">Early bird slots are limited. Complete your profile before team creation.</p>
          </article>
          <article className="card p-6">
            <h2 className="text-xl font-bold">Invite-Friendly Teams</h2>
            <p className="mt-2 text-sm text-muted">Team leaders can share invite links or codes and approve join requests in one place.</p>
          </article>
        </section>

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
      </main>
    </div>
  );
}

