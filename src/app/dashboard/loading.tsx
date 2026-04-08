export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface-2" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-2xl border border-border bg-surface-2" />
            <div className="h-24 animate-pulse rounded-2xl border border-border bg-surface-2" />
            <div className="h-24 animate-pulse rounded-2xl border border-border bg-surface-2" />
          </div>
          <div className="h-60 animate-pulse rounded-2xl border border-border bg-surface-2" />
        </div>
      </main>
    </div>
  );
}
