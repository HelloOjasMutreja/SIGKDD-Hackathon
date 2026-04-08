import Link from "next/link";

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
      </main>
    </div>
  );
}

