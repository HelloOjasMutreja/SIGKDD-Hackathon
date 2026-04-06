import Link from "next/link";

export default function ParticipantPortalHome() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
        <section className="card p-8">
          <p className="pill inline-block">Participant Portal</p>
          <h1 className="mt-4 text-4xl font-bold">SIGKDD Hackathon</h1>
          <p className="mt-3 text-muted">
            Register, build your team, select your track, submit your project, and download your check-in QR.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/register" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">Register</Link>
            <Link href="/login" className="rounded-full border border-border bg-surface-2 px-5 py-2.5 text-sm font-semibold">Login</Link>
            <Link href="/org" className="rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold">Organizer Portal</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
