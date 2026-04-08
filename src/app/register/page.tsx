import { ParticipantRegistrationForm } from "@/components/participant-registration-form";
import { registerParticipant } from "@/app/register/actions";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const error = String(params.error ?? "");
  const invite = String(params.invite ?? "").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Participant Registration</h1>
          <p className="mt-1 text-sm text-muted">Complete this 4-step form to register for SIGKDD Hackathon 2025.</p>
          {invite && (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Invite detected for team code {invite}. Your join request will be auto-created after registration.
            </p>
          )}
          {error && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Error: {error.replaceAll("_", " ")}</p>}

          <ParticipantRegistrationForm invite={invite} action={registerParticipant} />
        </section>
      </main>
    </div>
  );
}
