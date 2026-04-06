const checkInPipeline = [
  {
    title: "QR scanner",
    detail: "Scan attendee code and validate registration status in real-time.",
  },
  {
    title: "Manual badge lookup",
    detail: "Search by name, email, or badge ID when QR scanning fails.",
  },
  {
    title: "Duplicate detection",
    detail: "Block repeated check-ins unless override is granted to authorized staff.",
  },
  {
    title: "Audit capture",
    detail: "Record scanner identity, method, and timestamp for every check-in.",
  },
];

export default function CheckInPage() {
  return (
    <section className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Event Check-In</h1>
        <p className="mt-2 text-sm text-muted">
          This route is the starting point for QR + badge lookup check-in operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {checkInPipeline.map((item) => (
          <article key={item.title} className="card p-5">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
