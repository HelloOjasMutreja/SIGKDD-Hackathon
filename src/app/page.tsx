import Link from "next/link";
import { quickStats, setupChecklist } from "@/lib/portal-data";

export default function Home() {
  return (
    <section className="space-y-8">
      <div className="card grid gap-6 p-8 md:grid-cols-2 md:items-end">
        <div>
          <p className="pill inline-block">Implementation started</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">SIGKDD Hackathon Portal</h1>
          <p className="mt-3 max-w-xl text-muted">
            Foundation modules are live for registration, teams, tracks, organizer roles,
            submissions, and check-in workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <Link
            href="/register"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
          >
            Continue to registration
          </Link>
          <Link href="/admin" className="rounded-full border border-border bg-surface-2 px-5 py-2.5 text-sm font-semibold">
            Organizer workspace
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {quickStats.map((stat) => (
          <article key={stat.label} className="card p-5">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold">Current build checklist</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {setupChecklist.map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
