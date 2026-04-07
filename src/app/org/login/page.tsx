import Link from "next/link";
import { ApprovalStatus, UserRole } from "@/lib/domain";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setOrganizerSession } from "@/lib/auth";
import { hashPassword } from "@/lib/security";

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function organizerLogin(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organizerProfile: true },
  });

  if (
    !user ||
    !user.organizerProfile ||
    (user.role !== UserRole.ORGANIZER && user.role !== UserRole.ADMIN) ||
    user.passwordHash !== hashPassword(password)
  ) {
    redirect("/org/login?error=invalid_credentials");
  }

  await setOrganizerSession({
    userId: user.id,
    role: user.role,
    approvalStatus: user.organizerProfile.status,
    approvedRole: user.organizerProfile.approvedRole,
  });

  if (user.organizerProfile.status === ApprovalStatus.APPROVED) {
    redirect("/org/dashboard");
  }

  redirect("/org/pending");
}

export default async function OrgLoginPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const error = String(params.error ?? "");

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <main className="mx-auto max-w-xl px-6 py-16">
        <section className="rounded-2xl border border-[#cdd8e5] bg-white p-6">
          <h1 className="text-2xl font-bold text-[#17324d]">Organizer Login</h1>
          <p className="mt-1 text-sm text-[#4f647b]">Login to continue into the organizer workspace.</p>
          {error && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Invalid credentials.</p>}
          <form action={organizerLogin} className="mt-5 grid gap-3">
            <input name="email" type="email" required placeholder="Email" className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm" />
            <input name="password" type="password" required placeholder="Password" className="rounded-xl border border-[#cdd8e5] px-3 py-2 text-sm" />
            <button className="rounded-xl bg-[#17324d] px-4 py-2 text-sm font-semibold text-white">Login</button>
          </form>
          <p className="mt-4 text-sm text-[#4f647b]">No organizer account? <Link href="/org/register" className="text-[#17324d]">Register</Link></p>
        </section>
      </main>
    </div>
  );
}
