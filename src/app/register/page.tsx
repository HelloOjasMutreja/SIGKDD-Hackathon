import { redirect } from "next/navigation";
import { TeamMemberStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setParticipantSession } from "@/lib/auth";
import { hashPassword } from "@/lib/security";

const REGISTER_REGEX = /^RA\d{13}$/;
const ALLOWED_YEARS = [2027, 2028, 2029] as const;

type SearchProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function registerParticipant(formData: FormData) {
  "use server";

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const registerNumber = String(formData.get("registerNumber") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const graduationYear = Number(String(formData.get("graduationYear") ?? ""));
  const college = String(formData.get("college") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const inviteCode = String(formData.get("invite") ?? "").trim().toUpperCase();

  if (!fullName || !email || !password || !registerNumber || !phone || !college || !department) {
    redirect("/register?error=missing");
  }

  if (password !== confirmPassword) {
    redirect("/register?error=password_mismatch");
  }

  if (!REGISTER_REGEX.test(registerNumber)) {
    redirect("/register?error=register_number");
  }

  if (!ALLOWED_YEARS.includes(graduationYear as (typeof ALLOWED_YEARS)[number])) {
    redirect("/register?error=graduation_year");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    redirect("/register?error=email_exists");
  }

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      phone,
      role: "PARTICIPANT",
      passwordHash: hashPassword(password),
      participant: {
        create: {
          registerNumber,
          graduationYear,
          college,
          department,
        },
      },
    },
  });

  await setParticipantSession({ userId: user.id, role: user.role });

  if (inviteCode) {
    const invitedTeam = await prisma.team.findUnique({ where: { code: inviteCode } });
    if (invitedTeam) {
      await prisma.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId: invitedTeam.id,
            userId: user.id,
          },
        },
        update: { status: TeamMemberStatus.PENDING },
        create: {
          teamId: invitedTeam.id,
          userId: user.id,
          status: TeamMemberStatus.PENDING,
        },
      });
      redirect(`/team-setup/pending?teamId=${invitedTeam.id}&invite=1`);
    }
  }

  redirect("/team-setup");
}

export default async function RegisterPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const error = String(params.error ?? "");
  const invite = String(params.invite ?? "").toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="card p-6">
          <h1 className="text-2xl font-bold">Participant Registration</h1>
          <p className="mt-1 text-sm text-muted">Create your participant account and continue to team setup.</p>
          {invite && (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Invite detected for team code {invite}. Your join request will be auto-created after registration.
            </p>
          )}
          {error && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">Error: {error.replaceAll("_", " ")}</p>}

          <form action={registerParticipant} className="mt-5 grid gap-3 md:grid-cols-2">
            <input name="fullName" required placeholder="Full Name" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <input name="email" type="email" required placeholder="Email" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <input name="password" type="password" required placeholder="Password" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <input name="confirmPassword" type="password" required placeholder="Confirm Password" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <input name="registerNumber" required placeholder="Register Number (RA + 13 digits)" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <input name="phone" required placeholder="Phone Number" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <select name="graduationYear" required className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
              <option value="">Graduation Year</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
            </select>
            <input name="college" required placeholder="College / Institution" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" />
            <input name="department" required placeholder="Department / Branch" className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm md:col-span-2" />
            <input type="hidden" name="invite" value={invite} />
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white md:col-span-2">Register and continue</button>
          </form>
        </section>
      </main>
    </div>
  );
}
