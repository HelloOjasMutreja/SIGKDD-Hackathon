const trackRules = [
  "Each team can select one active track",
  "Track capacity and waitlist handling",
  "Track switch cutoff before submission deadline",
  "Track manager ownership and visibility",
];

export default function TracksPage() {
  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Tracks</h1>
        <p className="mt-2 text-sm text-muted">
          Configure tracks and assignment logic before registrations scale.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Policy rules to enforce in API layer</h2>
        <ul className="mt-4 grid gap-3">
          {trackRules.map((rule) => (
            <li key={rule} className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
