export default function TeamDashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-6">
          <div className="h-28 animate-pulse rounded-2xl border border-border bg-surface-2" />
          <div className="h-56 animate-pulse rounded-2xl border border-border bg-surface-2" />
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface-2" />
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface-2" />
        </div>
      </main>
    </div>
  );
}
