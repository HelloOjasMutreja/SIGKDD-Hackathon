const fields = [
  "Full name",
  "Email",
  "Phone",
  "Institute",
  "Graduation year",
  "City/Country",
  "Emergency contact",
  "Consent selections",
];

export default function RegisterPage() {
  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Participant Registration</h1>
        <p className="mt-2 text-sm text-muted">
          The registration wizard will be connected to auth and Prisma in the next implementation slice.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Planned wizard steps</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {fields.map((item, index) => (
            <li key={item} className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
              <p className="font-medium">Step {index + 1}</p>
              <p className="mt-1 text-muted">{item}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
