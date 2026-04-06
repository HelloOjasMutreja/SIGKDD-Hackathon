import Link from "next/link";
import { mainNav } from "@/lib/portal-data";
import { getSessionUser } from "@/lib/session";

export async function AppHeader() {
  const session = await getSessionUser();

  return (
    <header className="border-b border-border/70 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            KDD
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Organizer Console</p>
            <p className="text-sm font-semibold">Hackathon Registration Portal</p>
          </div>
        </Link>

        <nav className="flex flex-wrap gap-2">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="text-right">
          <p className="text-xs text-muted">Active session</p>
          <p className="text-sm font-semibold">{session ? `${session.fullName} (${session.role})` : "Not signed in"}</p>
        </div>
      </div>
    </header>
  );
}
