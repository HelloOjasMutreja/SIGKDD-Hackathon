import Link from "next/link";
import { ApprovalStatus, OrganizerApprovedRole, OrganizerRequestedRole, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setOrganizerSession } from "@/lib/auth";
import { hashPassword } from "@/lib/security";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function registerOrganizer(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const requestedRole = String(formData.get("requestedRole") ?? "") as OrganizerRequestedRole;
  const reasonForJoining = String(formData.get("reasonForJoining") ?? "").trim();

  if (!fullName || !email || !password || !phone || !requestedRole || !reasonForJoining) {
    redirect("/org/register?error=missing");
  }

  if (password !== confirmPassword) {
    redirect("/org/register?error=password_mismatch");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/org/register?error=email_exists");
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
    redirect("/org/dashboard");
  }

  redirect("/org/pending");
}

export default async function OrgRegisterPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const error = String(params.error ?? "");

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Organizer Registration</h1>
          <p className="mt-1 text-sm text-[#4f647b]">Request access to the organizer portal.</p>
          {error && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Error: {error.replaceAll("_", " ")}</p>}
          <form action={registerOrganizer} className="mt-5 grid gap-3 md:grid-cols-2">
            <input name="fullName" required placeholder="Full Name" className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm" />
            <input name="email" type="email" required placeholder="Email" className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm" />
            <input name="password" type="password" required placeholder="Password" className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm" />
            <input name="confirmPassword" type="password" required placeholder="Confirm Password" className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm" />
            <input name="phone" required placeholder="Phone Number" className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm" />
            <select name="requestedRole" required className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm">
              <option value="">Requested Role</option>
              <option value="CORE_ORGANIZER">Core Organizer</option>
              <option value="TECHNICAL_LEAD">Technical Lead</option>
              <option value="LOGISTICS">Logistics</option>
              <option value="VOLUNTEER">Volunteer</option>
              <option value="PR_MARKETING">PR & Marketing</option>
            </select>
            <textarea name="reasonForJoining" required placeholder="Reason for joining" className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm md:col-span-2" rows={4} />
            <button className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white md:col-span-2">Submit organizer request</button>
          </form>
          <p className="mt-4 text-sm text-[#4f647b]">Already registered? <Link href="/org/login" className="text-[#17324d]">Login</Link></p>
        </section>
      </main>
    </div>
  );
}
