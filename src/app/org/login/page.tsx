import Link from "next/link";
import { ApprovalStatus, UserRole } from "@/lib/domain";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setOrganizerSession } from "@/lib/auth";
import { hashPassword } from "@/lib/security";
import { formErrorClass, formFieldClass, getFormErrorMessage, isValidEmail, normalizeEmail, normalizeFormValue } from "@/lib/utils";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function organizerLogin(formData: FormData) {
  "use server";

  const email = normalizeEmail(formData.get("email"));
  const password = normalizeFormValue(formData.get("password"));

  if (!email) redirect("/organizer/login?error=missing_email");
  if (!isValidEmail(email)) redirect("/organizer/login?error=invalid_email");
  if (!password) redirect("/organizer/login?error=missing_password");

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organizerProfile: true },
  });

  if (!user || user.passwordHash !== hashPassword(password)) {
    redirect("/organizer/login?error=invalid_credentials");
  }

  if (!user.organizerProfile || (user.role !== UserRole.ORGANIZER && user.role !== UserRole.ADMIN)) {
    redirect("/organizer/login?error=organizer_access_not_assigned");
  }

  await setOrganizerSession({
    userId: user.id,
    role: user.role,
    approvalStatus: user.organizerProfile.status,
    approvedRole: user.organizerProfile.approvedRole,
  });

  if (user.organizerProfile.status === ApprovalStatus.APPROVED) {
    redirect("/organizer/dashboard");
  }

  redirect("/organizer/pending");
}

export default async function OrgLoginPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const error = String(params.error ?? "");

  const errorMessage = getFormErrorMessage(error, {
    missing_email: "Please enter your email.",
    invalid_email: "Please enter a valid email address.",
    missing_password: "Please enter your password.",
    organizer_access_not_assigned: "Organizer access has not been assigned to this account.",
    invalid_credentials: "Email or password is incorrect.",
  }, "Please check the highlighted fields and try again.");

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <main className="mx-auto max-w-xl px-6 py-16">
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Organizer Login</h1>
          <p className="mt-1 text-sm text-[#4f647b]">Login to continue into the organizer workspace.</p>
          {error && <p className={formErrorClass}>{errorMessage}</p>}
          <form action={organizerLogin} className="mt-5 grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Email *</span>
              <input name="email" type="email" required autoComplete="email" placeholder="Please enter your email" className={formFieldClass} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Password *</span>
              <input name="password" type="password" required autoComplete="current-password" placeholder="Please enter your password" className={formFieldClass} />
            </label>
            <button className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white">Login</button>
          </form>
          <p className="mt-4 text-sm text-[#4f647b]">No organizer account? <Link href="/organizer/register" className="text-[#17324d]">Register</Link></p>
        </section>
      </main>
    </div>
  );
}

