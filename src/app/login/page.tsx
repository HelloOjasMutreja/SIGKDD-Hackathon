import Link from "next/link";
import { redirect } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import { prisma } from "@/lib/prisma";
import { setParticipantSession } from "@/lib/auth";
import { getParticipantTeamState } from "@/lib/guards";
import { UserRole } from "@/lib/domain";
import { hashPassword } from "@/lib/security";
import { formErrorClass, formFieldClass, getFormErrorMessage, isValidEmail, normalizeEmail, normalizeFormValue } from "@/lib/utils";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function participantLogin(formData: FormData) {
  "use server";
  const email = normalizeEmail(formData.get("email"));
  const password = normalizeFormValue(formData.get("password"));

  if (!email) redirect("/login?error=missing_email");
  if (!isValidEmail(email)) redirect("/login?error=invalid_email");
  if (!password) redirect("/login?error=missing_password");

  const user = await prisma.user.findUnique({ where: { email }, include: { participant: true } });
  if (!user || !user.participant || user.passwordHash !== hashPassword(password)) {
    redirect("/login?error=invalid_credentials");
  }

  await setParticipantSession({ userId: user.id, role: UserRole.PARTICIPANT });

  const state = await getParticipantTeamState(user.id);
  if (state.state === "approved") {
    redirect(`/team/${state.teamId}`);
  }
  if (state.state === "pending") {
    redirect(`/team-setup?status=pending&teamId=${state.teamId}`);
  }

  redirect("/team-setup");
}

export default async function LoginPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const error = String(params.error ?? "");

  const errorMessage = getFormErrorMessage(error, {
    missing_email: "Please enter your email.",
    invalid_email: "Please enter a valid email address.",
    missing_password: "Please enter your password.",
    invalid_credentials: "Email or password is incorrect.",
  }, "Please check the highlighted fields and try again.");

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-xl px-6 py-16">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Participant Login</h1>
          <p className="mt-1 text-sm text-muted">Login to continue your registration journey.</p>
          {error && <p className={formErrorClass}>{errorMessage}</p>}
          <form action={participantLogin} className="mt-5 grid gap-3">
            <label className="grid gap-1 text-sm font-medium">
              <span>Email *</span>
              <input name="email" type="email" required autoComplete="email" placeholder="Please enter your email" className={formFieldClass} />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              <span>Password *</span>
              <input name="password" type="password" required autoComplete="current-password" placeholder="Please enter your password" className={formFieldClass} />
            </label>
            <FormSubmitButton pendingLabel="Logging in..." className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">Login</FormSubmitButton>
          </form>
          <p className="mt-4 text-sm text-muted">No account? <Link href="/register" className="text-accent">Register now</Link></p>
        </section>
      </main>
    </div>
  );
}
