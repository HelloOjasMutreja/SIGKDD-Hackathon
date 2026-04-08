import { ParticipantRegistrationForm } from "@/components/participant-registration-form";
import { registerParticipant } from "@/app/register/actions";
import { formErrorClass } from "@/lib/utils";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const error = String(params.error ?? "");
  const invite = String(params.invite ?? "").toUpperCase();

  const errorMessages: Record<string, string> = {
    missing_full_name: "Please enter your full name.",
    missing_email: "Please enter your email.",
    invalid_email: "Please enter a valid email address.",
    missing_password: "Please enter a password.",
    missing_confirm_password: "Please confirm your password.",
    missing_register_number: "Please enter your register number.",
    missing_phone: "Please enter your phone number.",
    invalid_phone: "Enter a valid 10 digit phone number.",
    missing_graduation_year: "Please select your graduation year.",
    missing_city: "Please enter your city.",
    missing_gender: "Please select your gender.",
    missing_college: "Please enter your college or institution.",
    missing_department: "Please enter your department or branch.",
    missing_coding_experience: "Please select your coding experience.",
    missing_hackathon_experience: "Please select your hackathon experience.",
    missing_domains: "Please enter your preferred domains.",
    missing_github_url: "Please enter your GitHub profile URL.",
    missing_linkedin_url: "Please enter your LinkedIn profile URL.",
    missing_tshirt_size: "Please select your T-shirt size.",
    missing_expectations: "Please tell us what you want to build or learn.",
    password_mismatch: "Passwords do not match.",
    register_number: "Please enter a valid register number in the format RA + 13 digits.",
    graduation_year: "Please choose a valid graduation year.",
    github_url: "Please enter a valid GitHub profile URL.",
    linkedin_url: "Please enter a valid LinkedIn profile URL.",
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Participant Registration</h1>
          <p className="mt-1 text-sm text-muted">Complete this 4-step form to register for SIGKDD Hackathon 2026.</p>
          {invite && (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Invite detected for team code {invite}. Your join request will be auto-created after registration.
            </p>
          )}
          {error && <p className={formErrorClass}>{errorMessages[error] ?? "Please check the highlighted fields and try again."}</p>}

          <ParticipantRegistrationForm invite={invite} action={registerParticipant} />
        </section>
      </main>
    </div>
  );
}
