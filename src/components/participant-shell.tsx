import Link from "next/link";

type ParticipantIdentity = {
  initials: string;
  roleLabel: string;
  displayName: string;
};

type ParticipantShellProps = {
  children: React.ReactNode;
  identity?: ParticipantIdentity | null;
};

export function ParticipantShell({ children, identity = null }: ParticipantShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold">SIGKDD Participant Portal</Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/dashboard" className="rounded-full border border-border px-3 py-1.5">Dashboard</Link>
            <Link href="/team-setup" className="rounded-full border border-border px-3 py-1.5">Team Setup</Link>
            <Link href="/profile" className="rounded-full border border-border px-3 py-1.5">Profile</Link>
            {identity && (
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{identity.initials}</span>
                <span className="max-w-[9rem] truncate text-xs font-semibold text-foreground">{identity.displayName}</span>
                <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{identity.roleLabel}</span>
              </div>
            )}
            <Link href="/logout" className="rounded-full bg-accent px-3 py-1.5 text-white">Logout</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
