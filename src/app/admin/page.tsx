import { roleCards } from "@/lib/portal-data";

export default function AdminPage() {
  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Organizer Admin Workspace</h1>
        <p className="mt-2 text-sm text-muted">
          Launch role model is scaffolded so each workflow can be connected to authorization checks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roleCards.map((role) => (
          <article key={role.title} className="card p-5">
            <h2 className="text-lg font-semibold">{role.title}</h2>
            <p className="mt-2 text-sm text-muted">{role.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
