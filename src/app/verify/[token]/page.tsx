type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function VerifyTeamPage({ params }: PageProps) {
  await params;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <section className="card p-6">
        <h1 className="text-2xl font-bold">QR Verification Paused</h1>
        <p className="mt-2 text-sm text-muted">QR-based verification is currently disabled. Please use organizer manual check-in with team code.</p>
      </section>
    </main>
  );
}
