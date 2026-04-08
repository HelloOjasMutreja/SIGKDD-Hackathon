import Link from "next/link";

export function OrganizerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <header className="border-b border-[#cdd8e5] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/organizer/dashboard" className="text-lg font-bold text-[#17324d]">SIGKDD Organizer Portal</Link>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link href="/organizer/dashboard" className="rounded-full border border-[#cdd8e5] px-3 py-1.5">Dashboard</Link>
            <Link href="/organizer/teams" className="rounded-full border border-[#cdd8e5] px-3 py-1.5">Teams</Link>
            <Link href="/organizer/review" className="rounded-full border border-[#cdd8e5] px-3 py-1.5">Review</Link>
            <Link href="/organizer/scanner" className="rounded-full border border-[#cdd8e5] px-3 py-1.5">Scanner</Link>
            <Link href="/organizer/operations" className="rounded-full border border-[#cdd8e5] px-3 py-1.5">Operations</Link>
            <Link href="/organizer/roles" className="rounded-full border border-[#cdd8e5] px-3 py-1.5">Roles</Link>
            <Link href="/organizer/admin/approvals" className="rounded-full border border-[#cdd8e5] px-3 py-1.5">Organizer Approvals</Link>
            <Link href="/organizer/logout" className="rounded-full bg-[#17324d] px-3 py-1.5 text-white">Logout</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

