import Link from "next/link";

export function ParticipantShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold">SIGKDD Participant Portal</Link>
          <nav className="flex gap-2 text-sm">
            <Link href="/dashboard" className="rounded-full border border-border px-3 py-1.5">Dashboard</Link>
            <Link href="/team-setup" className="rounded-full border border-border px-3 py-1.5">Team Setup</Link>
            <Link href="/profile" className="rounded-full border border-border px-3 py-1.5">Profile</Link>
            <Link href="/logout" className="rounded-full bg-accent px-3 py-1.5 text-white">Logout</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
