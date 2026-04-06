const teamFlows = [
  "Create team and set captain",
  "Invite teammates by email",
  "Accept or decline invitation",
  "Transfer captain role",
  "Lock team at deadline",
];

export default function TeamsPage() {
  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <p className="mt-2 text-sm text-muted">
          Team creation and member invite actions are scaffolded at route level and ready for API wiring.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Team lifecycle milestones</h2>
        <div className="mt-4 grid gap-3">
          {teamFlows.map((flow) => (
            <article key={flow} className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
              {flow}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
