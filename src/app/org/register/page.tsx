import Link from "next/link";
import { ApprovalStatus, OrganizerApprovedRole, OrganizerRequestedRole, UserRole } from "@/lib/domain";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setOrganizerSession } from "@/lib/auth";
import { hashPassword } from "@/lib/security";
import { formErrorClass, formFieldClass, formSelectClass, formTextareaClass, getFormErrorMessage, isValidEmail, normalizeEmail, normalizeFormValue } from "@/lib/utils";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function registerOrganizer(formData: FormData) {
  "use server";

  const fullName = normalizeFormValue(formData.get("fullName"));
  const email = normalizeEmail(formData.get("email"));
  const password = normalizeFormValue(formData.get("password"));
  const confirmPassword = normalizeFormValue(formData.get("confirmPassword"));
  const phone = normalizeFormValue(formData.get("phone"));
  const requestedRole = String(formData.get("requestedRole") ?? "") as OrganizerRequestedRole;
  const reasonForJoining = normalizeFormValue(formData.get("reasonForJoining"));

  if (!fullName) redirect("/organizer/register?error=missing_full_name");
  if (!email) redirect("/organizer/register?error=missing_email");
  if (!isValidEmail(email)) redirect("/organizer/register?error=invalid_email");
  if (!password) redirect("/organizer/register?error=missing_password");
  if (!confirmPassword) redirect("/organizer/register?error=missing_confirm_password");
  if (!phone) redirect("/organizer/register?error=missing_phone");
  if (!requestedRole) redirect("/organizer/register?error=missing_requested_role");
  if (!reasonForJoining) redirect("/organizer/register?error=missing_reason");

  if (password !== confirmPassword) {
    redirect("/organizer/register?error=password_mismatch");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/organizer/register?error=email_exists");
  }

  const hasAdmin = await prisma.user.count({ where: { role: UserRole.ADMIN } });
  const autoApprove = hasAdmin === 0;

  const role = autoApprove ? UserRole.ADMIN : UserRole.ORGANIZER;

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      passwordHash: hashPassword(password),
      role,
      organizerProfile: {
        create: {
          requestedRole,
          approvedRole: autoApprove
            ? OrganizerApprovedRole.CORE_ORGANIZER
            : null,
          status: autoApprove ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
          reasonForJoining,
          approvedAt: autoApprove ? new Date() : null,
        },
      },
    },
    include: { organizerProfile: true },
  });

  await setOrganizerSession({
    userId: user.id,
    role: user.role,
    approvalStatus: user.organizerProfile?.status ?? ApprovalStatus.PENDING,
    approvedRole: user.organizerProfile?.approvedRole ?? null,
  });

  if (autoApprove) {
    redirect("/organizer/dashboard");
  }

  redirect("/organizer/pending");
}

export default async function OrgRegisterPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const error = String(params.error ?? "");

  const errorMessage = getFormErrorMessage(error, {
    missing_full_name: "Please enter your full name.",
    missing_email: "Please enter your email.",
    invalid_email: "Please enter a valid email address.",
    missing_password: "Please enter a password.",
    missing_confirm_password: "Please confirm your password.",
    missing_phone: "Please enter your phone number.",
    missing_requested_role: "Please choose a requested role.",
    missing_reason: "Please enter a reason for joining.",
    password_mismatch: "Passwords do not match.",
    email_exists: "This email is already registered.",
  });

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Organizer Registration</h1>
          <p className="mt-1 text-sm text-[#4f647b]">Request access to the organizer portal.</p>
          {error && <p className={formErrorClass}>{errorMessage}</p>}
          <form action={registerOrganizer} className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Full Name *</span>
              <input name="fullName" required placeholder="Enter your full name" className={formFieldClass} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Email *</span>
              <input name="email" type="email" required placeholder="Enter your email" className={formFieldClass} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Password *</span>
              <input name="password" type="password" required placeholder="Enter your password" className={formFieldClass} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Confirm Password *</span>
              <input name="confirmPassword" type="password" required placeholder="Confirm your password" className={formFieldClass} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Phone Number *</span>
              <input name="phone" required placeholder="Enter your phone number" className={formFieldClass} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#17324d]">
              <span>Requested Role *</span>
              <select name="requestedRole" required className={formSelectClass}>
                <option value="">Select a role</option>
                <option value="CORE_ORGANIZER">Core Organizer</option>
                <option value="REVIEWER">Reviewer</option>
                <option value="CHECKIN_MANAGER">Check-in Manager</option>
                <option value="TECHNICAL_LEAD">Technical Lead</option>
                <option value="LOGISTICS">Logistics</option>
                <option value="VOLUNTEER">Volunteer</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-[#17324d] md:col-span-2">
              <span>Reason for Joining *</span>
              <textarea name="reasonForJoining" required placeholder="Explain why you want to join" className={formTextareaClass} rows={4} />
            </label>
            <button className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white md:col-span-2">Submit organizer request</button>
          </form>
          <p className="mt-4 text-sm text-[#4f647b]">Already registered? <Link href="/organizer/login" className="text-[#17324d]">Login</Link></p>
        </section>
      </main>
    </div>
  );
}

